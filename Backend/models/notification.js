import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['ORDER', 'BILL', 'STOCK', 'STAFF', 'SYSTEM'],
      default: 'SYSTEM',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: {
      type: Object,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
