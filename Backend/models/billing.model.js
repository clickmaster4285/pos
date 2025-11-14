import mongoose, { Schema } from 'mongoose';

const BillingSchema = new Schema(
  {
    billNumber: {
      type: String,
      unique: true,
      required: [true, 'Bill number is required'],
      uppercase: true,
      trim: true,
      maxlength: [50, 'Bill number cannot exceed 50 characters'],
    },
    companyId: { type: String, required: true },
    createdBy: { type: String },
    buyer: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    OrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Orders',
    },
    items: [
      {
        ProductId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        OrderItemId: {
          type: Schema.Types.ObjectId,
        },

        dynamicAttributes: {
          type: Map, // or Schema.Types.Mixed
          of: Schema.Types.Mixed,
          default: {},
        },
        itemName: { type: String, required: true, trim: true, maxlength: 100 },

        quantity: {
          type: Number,
          required: true,
          min: 1,
          max: 10000,
          validate: {
            validator: Number.isInteger,
            message: 'Quantity must be an integer',
          },
        },
        price: { type: Number, required: true, min: 0 },

        total: { type: Number, min: 0, default: 0 },

        refundAmount: { type: Number, min: 0, default: 0 },
        refundHistory: [
          {
            refundQuantity: { type: Number, required: true, min: 1 },
            refundAmount: { type: Number, required: true, min: 0 },
            refundReason: { type: String, trim: true },
            refundedBy: { type: String, required: true },
            refundedAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'bank_transfer'],
      required: true,
    },
    paymentNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    refundDetails: {
      totalRefundAmount: { type: Number, default: 0, min: 0 },
      refundedAt: { type: Date },
      refundedBy: { type: String },
      refundReason: { type: String, trim: true },
    },
    history: [
      {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        notes: { type: String, trim: true },
      },
    ],
    status: {
      type: String,
      enum: ['paid', 'refunded', 'partially_refunded'],
      default: 'paid',
    },
    // in bill schema
    discountPercent: {
      type: Number, // e.g. 10 means 10%
      default: 0,
    },

    discountAmount: {
      type: Number, // actual currency amount subtracted from subtotal
      default: 0,
    },

    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
BillingSchema.index({ billNumber: 1 }, { unique: true });

// Buyer details validation for non-cash payments
BillingSchema.pre('validate', function (next) {
  if (['credit_card', 'bank_transfer'].includes(this.paymentMethod)) {
    if (!this.paymentNumber?.trim()) {
      console.error(
        'Schema validation error: Payment number is required for non-cash payment'
      );
      return next(new Error('Payment number is required for non-cash payment'));
    }
  }
  next();
});

// Company consistency
BillingSchema.pre('validate', async function (next) {
  // If bill has no OrderId, skip this check (product-only bills)
  if (!this.OrderId) return next();

  try {
    const order = await mongoose
      .model('Orders')
      .findById(this.OrderId)
      .select('companyId');

    if (!order) return next(); // or throw if you want strict behavior

    if (String(order.companyId) !== String(this.companyId)) {
      return next(new Error('Order company must match the bill company'));
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Prevent billNumber changes after creation
BillingSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('billNumber')) {
    console.error('Schema validation error: Attempted to modify billNumber');
    return next(new Error('Bill number cannot be modified after creation'));
  }
  next();
});

BillingSchema.pre('validate', function (next) {
  const n = (v) => Number(v || 0);
  const EPS = 0.01;

  if (!Array.isArray(this.items) || this.items.length === 0) {
    return next(new Error('Bill must have at least one item'));
  }

  // 🔹 If this is an EXISTING bill in a refund state,
  //     DO NOT touch subtotal/discount/tax/total.
  //     We want to keep original totals, and track refunds separately.
  const isRefundState =
    !this.isNew && ['refunded', 'partially_refunded'].includes(this.status);

  if (isRefundState) {
    // You *can* still clamp discountPercent if you want, but don't
    // recompute subtotal/tax/total here.
    let discountPercent = n(this.discountPercent);
    if (discountPercent < 0) discountPercent = 0;
    if (discountPercent > 100) discountPercent = 100;
    this.discountPercent = discountPercent;
    return next();
  }

  // 🔹 For NEW bills (or non-refunded ones),
  //     do the strict math: subtotal -> discount -> tax -> total

  // 1) Recalculate subtotal from items (respecting refund statuses)
  const subtotalFromItems = this.items.reduce((sum, it) => {
    const s = String(it.status || '').toLowerCase();

    // Exclude fully removed lines
    if (['cancelled', 'returned_accept', 'refund_full'].includes(s)) {
      return sum;
    }

    // For partials, subtract refundAmount
    if (['returned_request', 'refund_partial'].includes(s)) {
      const afterRefund = Math.max(0, n(it.total) - n(it.refundAmount));
      return sum + afterRefund;
    }

    // Normal line
    return sum + n(it.total);
  }, 0);

  if (Math.abs(n(this.subtotal) - subtotalFromItems) > EPS) {
    return next(
      new Error(
        'Subtotal must match the sum of non-cancelled and non-returned item totals'
      )
    );
  }

  // 2) Discount (percent only, keep amount in sync)
  let discountPercent = n(this.discountPercent);
  if (discountPercent < 0) discountPercent = 0;
  if (discountPercent > 100) discountPercent = 100;
  this.discountPercent = discountPercent;

  const expectedDiscountAmount = +(
    subtotalFromItems *
    (discountPercent / 100)
  ).toFixed(2);

  if (Math.abs(n(this.discountAmount) - expectedDiscountAmount) > EPS) {
    this.discountAmount = expectedDiscountAmount;
  }

  const taxableBase = subtotalFromItems - this.discountAmount;

  // 3) Tax and total
  const taxAmount = +(taxableBase * (n(this.taxPercent) / 100)).toFixed(2);
  const total = +(taxableBase + taxAmount).toFixed(2);

  if (Math.abs(n(this.taxAmount) - taxAmount) > EPS) {
    this.taxAmount = taxAmount;
  }
  if (Math.abs(n(this.total) - total) > EPS) {
    this.total = total;
  }

  return next();
});



export default mongoose.model('Bill', BillingSchema);
