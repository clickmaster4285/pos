// models/courierModel.js
import mongoose, { Schema } from 'mongoose';

const ENVIRONMENTS = ['Sandbox', 'Production'];
const CONNECTION_STATUSES = ['Connected', 'Not Connected'];

const CredentialSchema = new Schema(
  {
    baseUrl: { type: String, trim: true },
    clientId: { type: String, trim: true },
    clientSecret: { type: String, trim: true }, // will be encrypted before save
    apiKey: { type: String, trim: true },
    username: { type: String, trim: true },
    password: { type: String, trim: true }, // will be encrypted before save
    scope: { type: String, trim: true },
    environment: {
      type: String,
      enum: {
        values: ['Sandbox', 'Production'],
        message: '{VALUE} is not a valid environment',
      },
      default: 'Sandbox',
      required: [true, 'Environment is required'],
    },
    updatedAt: { type: Date, default: Date.now },
    setBy: { type: String }, // store user ID or email who last updated it
  },
  { _id: false }
);


const CourierHistorySchema = new Schema(
  {
    action: {
      type: String,
      enum: ['Created', 'Updated', 'Deleted', 'AuthTest'],
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

const CourierSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Courier code is required'],
      trim: true,
      uppercase: true,
    },
    companyId: { type: String, required: true },
    name: {
      type: String,
      required: [true, 'Courier name is required'],
      trim: true,
    },
    environment: {
      type: String,
      enum: {
        values: ENVIRONMENTS,
        message: '{VALUE} is not a valid environment',
      },
      default: 'Sandbox',
    },
    status: {
      type: String,
      enum: {
        values: CONNECTION_STATUSES,
        message: '{VALUE} is not a valid connection status',
      },
      default: 'Not Connected',
    },

    credentials: CredentialSchema,

    // Optional operational flags / routing hints
    supportsCOD: { type: Boolean, default: true },
    maxWeightKg: { type: Number, default: 30, min: 0 },
    domesticOnly: { type: Boolean, default: false },
    priority: { type: Number, default: 100, min: 0 },

    history: [CourierHistorySchema],
    deleted: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        if (ret?.credentials) {
          delete ret.credentials.clientSecret;
          delete ret.credentials.apiKey;
          delete ret.credentials.password;
        }
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Uniqueness per environment (DHL in Sandbox is separate from DHL in Production)
CourierSchema.index({ code: 1, environment: 1 }, { unique: true });

export default mongoose.model('Courier', CourierSchema);
