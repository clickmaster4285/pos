// models/shipmentModel.js
import mongoose, { Schema } from 'mongoose';

const NORMALIZED_STATUSES = [
  'PENDING',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
];

const CheckpointSchema = new Schema(
  {
    ts: { type: Date, required: true },
    location: { type: String },
    description: { type: String },
    rawStatus: { type: String, required: true },
    normalized: {
      type: String,
      enum: {
        values: NORMALIZED_STATUSES,
        message: '{VALUE} is not a valid normalized status',
      },
      required: [true, 'Normalized status is required'],
    },
  },
  { _id: false }
);

const ShipmentHistorySchema = new Schema(
  {
    action: {
      type: String,
      enum: ['Created', 'Updated', 'StatusChanged', 'Cancelled', 'Deleted'],
      required: true,
    },
    performedBy: {
      type: String, // userId/email
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ShipmentSchema = new Schema(
  {
    // identifiers
    awb: {
      type: String,
      required: [true, 'AWB is required'],
      unique: true,
      trim: true,
    },
    companyId: { type: String, required: true },
  
    courierId: {
      type: String,
      required: [true, 'Courier ID is required'],
    },
    courierCode: {
      type: String,
      required: [true, 'Courier code is required'],
      uppercase: true,
      trim: true,
    },
    courierName: { type: String, required: [true, 'Courier name is required'] },

    from_wareHouse: {
      type: String,
      required: [true, 'Courier warehouse is required'],
    },

    // recipient/destination
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
    },
    toAddress: {
      type: String,
      required: [true, 'Destination address is required'],
    },
    toCity: { type: String, required: [true, 'Destination city is required'] },
    toPhone: { type: String },

    // parcel + money
    cod: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number, min: 0 },
    },
    weightKg: {
      type: Number,
      required: [true, 'Weight (kg) is required'],
      min: 0,
    },
    dimensions: {
      length: { type: Number, required: true, min: 0 },
      width: { type: Number, required: true, min: 0 },
      height: { type: Number, required: true, min: 0 },
    },
    serviceLevel: {
      type: String,
      enum: {
        values: ['Standard', 'Express', 'Same Day'],
        message: '{VALUE} is not a valid service level',
      },
      default: 'Standard',
    },

    // tracking
    statusRaw: { type: String, required: [true, 'Raw status is required'] },
    statusNormalized: {
      type: String,
      enum: {
        values: NORMALIZED_STATUSES,
        message: '{VALUE} is not a valid normalized status',
      },
      required: [true, 'Normalized status is required'],
    },
    createdAt: { type: Date, default: Date.now },

    checkpoints: { type: [CheckpointSchema], default: [] },
    history: [ShipmentHistorySchema],

    // soft delete + flags
    deleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String }, // optional: track creator
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Useful indexes
ShipmentSchema.index({ courierId: 1 });
ShipmentSchema.index({ statusNormalized: 1, createdAt: -1 });

export default mongoose.model('Shipment', ShipmentSchema);
