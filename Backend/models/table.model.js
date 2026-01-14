// models/table.model.js
import mongoose, { Schema } from 'mongoose';

const TABLE_STATES = [
  'available',
  'occupied',
  'awaiting_payment',
  'reserved',
  // 'assigned', // 🚫 not used anymore
];

const ReservationSchema = new mongoose.Schema(
  {
    startISO: { type: Date, required: true, index: true },
    endISO: { type: Date, required: true, index: true },
    name: { type: String },
    phone: { type: String },
    note: { type: String },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'canceled', 'completed'],
      default: 'upcoming',
      index: true,
    },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const TableSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    seats: { type: Number, min: 1, default: 2 },
    state: { type: String, enum: TABLE_STATES, default: 'available' },

    // Waiter is mandatory on creation (we’ll enforce in controller)
    assignedWaiterId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
      index: true,
    },

    reservations: { type: [ReservationSchema], default: [] },

    deleted: { type: Boolean, default: false },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);


export default mongoose.model('Table', TableSchema);
