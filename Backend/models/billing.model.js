// billing.model.js
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
      match: [
        /^[A-Z0-9-]+$/,
        'Bill number can only contain A–Z, 0–9, and hyphens',
      ],
    },
    userId: { type: String, required: true },
    companyId: { type: String, required: true },
    createdBy: { type: String },
    buyer: {
      name: { type: String,  trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    items: [
      {
        inventoryItem: {
          type: Schema.Types.ObjectId,
          ref: 'Inventory',
          required: true,
        },
        variantId: { type: Schema.Types.ObjectId, required: true },
        variantName: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        itemName: { type: String, required: true, trim: true, maxlength: 100 },
        sku: {
          type: String,
          required: true,
          trim: true,
          match: [/^[A-Z0-9-]+$/],
        },
        returnUnder: {
          type: Number,
          required: true,
          min: 0,
          validate: Number.isInteger,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          max: 10000,
          validate: Number.isInteger,
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
          // NEW: Track individual refunds for each item
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
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'],
      required: true,
    },
    notes: { type: String, trim: true },
    // NEW: Track refund details at bill level
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
        notes: { type: String, trim: true }, // Added notes to history
      },
    ],
    status: {
      type: String,
      enum: ['paid', 'refunded', 'partially_refunded'], // UPDATED: Added partially_refunded
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

// ... keep your existing indexes and pre-save hooks ...

// Indexes
BillingSchema.index({ billNumber: 1 }, { unique: true });
BillingSchema.index({ userId: 1, createdAt: -1 });
BillingSchema.index({ companyId: 1, deleted: 1 });
// If you don't have deletedAt, remove the TTL index entirely.
// BillingSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Company consistency
BillingSchema.pre('validate', async function (next) {
  if (this.items?.length) {
    const inventoryIds = this.items.map((it) => it.inventoryItem);
    const inventories = await mongoose
      .model('Inventory')
      .find({ _id: { $in: inventoryIds } })
      .select('companyId');
    const mismatch = inventories.find(
      (inv) => inv.companyId.toString() !== this.companyId.toString()
    );
    if (mismatch)
      return next(
        new Error('All items must belong to the same company as the bill')
      );
  }
  next();
});

// Totals consistency (match controller)
// 1) subtotal = sum of non-cancelled / non-returned_accept items
// 2) total = subtotal + taxAmount
BillingSchema.pre('validate', function (next) {
  const items = this.items || [];
  const sumEligible = items.reduce((sum, it) => {
    return ['cancelled', 'returned_accept'].includes(it.status)
      ? sum
      : sum + (it.total || 0);
  }, 0);

  // If you want to enforce exact math here:
  if (Math.abs(sumEligible - (this.subtotal || 0)) > 0.01) {
    return next(
      new Error(
        'Subtotal must match the sum of non-cancelled and non-returned item totals'
      )
    );
  }

  const computedTotal = Number(
    ((this.subtotal || 0) + (this.taxAmount || 0)).toFixed(2)
  );
  if (Math.abs(computedTotal - (this.total || 0)) > 0.01) {
    return next(new Error('Total must equal subtotal + taxAmount'));
  }

  next();
});

// Prevent billNumber changes after creation
BillingSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('billNumber')) {
    return next(new Error('Bill number cannot be modified after creation'));
  }
  next();
});

export default mongoose.model('Bill', BillingSchema);
