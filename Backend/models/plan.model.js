// src/models/PlanSchema.js (or wherever your schema is)
import mongoose, { Schema } from "mongoose";
import cc from "currency-codes";

const ALLOWED_FEATURES = [
  'Branch',
  "Staff",
  "Permissions",
  "Vendors",
  "Category",
  "WareHouse",
  "Attendance Device",
  "Manage Attendance",
  "Staff Salary",
  "Courier & Shipment",
  "Settings"
];

const VALID_CURRENCY_CODES = cc.codes();

const PlanSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [50, "Plan name cannot exceed 50 characters"],
      minlength: [3, "Plan name must be at least 3 characters"],
      match: [
        /^[a-zA-Z0-9\s-]+$/,
        "Plan name can only contain letters, numbers, spaces, and hyphens",
      ],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    price: {
      type: Number,
    },
    currencyCode: {
      type: String,
      required: [true, "Currency is required"],
      uppercase: true,
      trim: true,
      enum: {
        values: VALID_CURRENCY_CODES,
        message: "Invalid currency code. Choose from the list.",
      },
    },
    validateDays: Number,
    limitations: {
      maxBranch: {
        type: Number,
        default: 1,
      },
      maxStaff: {
        type: Number,
        default: 10,
      },
      maxProductItems: {
        type: Number,
        default: 100,
      },
      maxVendors: {
        type: Number,
        default: 50,
      },
      features: [
        {
          type: String,
          validate: {
            validator: (value) => ALLOWED_FEATURES.includes(value),
            message: `Feature must be one of: ${ALLOWED_FEATURES.join(", ")}`,
          },
        },
      ],
    },
    history: [
      {
        action: String,
        performedBy: String, //userId
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deleted: { type: Boolean, default: false },
    createdBy: {
      type: String,
      required: [true, "Creator is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PlanSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { deleted: false } });

export default mongoose.model("Plan", PlanSchema);