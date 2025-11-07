import mongoose, { Schema } from 'mongoose';

const OrderSchema = new Schema(
  {
    companyId: { type: String, required: true },

    orderNo: { type: String, required: true, unique: true },

    // customer info
    customerName: { type: String },
    customerPhone: { type: String },

    items: [
      {
        productId: String,
    
        name: String,
        qty: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        dynamicAttributes: {
          type: Map,
          of: Schema.Types.Mixed,
          default: {},
        },
      },
    ],

    // totals
    subTotal: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    shippingAddressId: {
      type: String,
      match: [/^[0-9a-fA-F]{24}$/, 'Invalid shipping address ID format'],
    },
    orderStatus: {
      type: String,
      enum: {
        values: [
          'pending',
          'cooking',
          'ready',
          'collected',
          'handed_over',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'returned_request',
          'returned_accept',
          'returned_reject',
        ],
        message:
          'Invalid status. Must be pending, processing, shipped, delivered, cancelled, or returned',
      },
      default: 'pending',
    },

    // flexible industry-specific info
    dynamicAttributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    history: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: { type: String, required: true },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: { type: String, required: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// OrderSchema.pre('save', function (next) {
//   if (this.items?.length) {
//     this.subTotal = this.items.reduce(
//       (sum, item) => sum + (item.total || 0),
//       0
//     );
//     this.grandTotal =
//       this.subTotal - this.discount + this.tax - this.refundAmount;
//   }
//   next();
// });

export default mongoose.model('Orders', OrderSchema);
