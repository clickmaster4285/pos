import mongoose, { Schema } from "mongoose";

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
      minlength: [2, "Company name must be at least 2 characters"],
      match: [
        /^[a-zA-Z0-9\s&.,'-]+$/,
        "Company name contains invalid characters",
      ],
      unique: true,
    },
    companyId: {
      type: String,
      unique: true,
      required: [true, "Company ID is required"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,63})+$/,
        "Please enter a valid email address",
      ],
      unique: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    plan: { type: [Schema.Types.Mixed], default: [] },
    owner: {
      type: String,
      // ref: 'User',
      required: [true, "Owner is required"],
    },
    gain: {
      staff: [String],
      inventory: Number,
      vendor: Number,
      order: Number,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    history: [
      {
        action: String,
        performedBy: String, //userId
      createdAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
    deleted: { type: Boolean, default: false },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("Company", CompanySchema);
