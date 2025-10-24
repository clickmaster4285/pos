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
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        itemName: { type: String, required: true, trim: true, maxlength: 100 },
        categoryName: { type: String, required: true, trim: true, maxlength: 100 },
        subCategory: { type: String, trim: true, maxlength: 100 },
        sku: {
          type: String,
          required: true,
        },
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
        costPrice: { type: Number, min: 0, default: 0 },
        total: { type: Number, required: true, min: 0 },
        status: {
          type: String,
          enum: [
            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'returned_request',
            'returned_accept',
            'returned_reject',
          ],
          default: 'pending',
        },
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
      console.error('Schema validation error: Payment number is required for non-cash payment');
      return next(new Error('Payment number is required for non-cash payment'));
    }
  }
  next();
});

// Company consistency
BillingSchema.pre('validate', async function (next) {
  if (this.items?.length) {
    try {
      const productIds = this.items.map((it) => it.productId);
      const products = await mongoose
        .model('Product')
        .find({ _id: { $in: productIds } })
        .select('companyId');
      const mismatch = products.find(
        (prod) => prod.companyId.toString() !== this.companyId.toString()
      );
      if (mismatch) {
        console.error('Schema validation error: Product companyId mismatch', {
          productId: mismatch._id,
          companyId: this.companyId,
        });
        return next(new Error('All items must belong to the same company as the bill'));
      }
    } catch (error) {
      console.error('Schema validation error: Failed to validate product company', error);
      return next(error);
    }
  }
  next();
});

// Totals consistency
BillingSchema.pre('validate', function (next) {
  const items = this.items || [];
  const sumEligible = items.reduce((sum, it) => {
    return ['cancelled', 'returned_accept'].includes(it.status)
      ? sum
      : sum + (it.total || 0);
  }, 0);

  // Use a small epsilon to handle floating-point precision
  const epsilon = 0.01;
  if (Math.abs(sumEligible - (this.subtotal || 0)) > epsilon) {
    console.error('Schema validation error: Subtotal mismatch', {
      calculated: sumEligible,
      provided: this.subtotal,
    });
    return next(
      new Error(
        'Subtotal must match the sum of non-cancelled and non-returned item totals'
      )
    );
  }

  const computedTotal = Number(
    ((this.subtotal || 0) + (this.taxAmount || 0)).toFixed(2)
  );
  if (Math.abs(computedTotal - (this.total || 0)) > epsilon) {
    console.error('Schema validation error: Total mismatch', {
      calculated: computedTotal,
      provided: this.total,
    });
    return next(new Error('Total must equal subtotal + taxAmount'));
  }

  next();
});

// Prevent billNumber changes after creation
BillingSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('billNumber')) {
    console.error('Schema validation error: Attempted to modify billNumber');
    return next(new Error('Bill number cannot be modified after creation'));
  }
  next();
});

export default mongoose.model('Bill', BillingSchema);