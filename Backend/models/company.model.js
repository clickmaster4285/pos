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
    companyLogo: {
      type: String,
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
    invoiceSettings: {
      format: {
        prefix: { type: String, default: "INV-" }, // e.g. INV-2025-001
        numbering: {
          type: String,
          enum: ["sequential", "yearly"],
          default: "sequential",
        },
        startNumber: { type: Number, default: 1 },
      },
      currency: {
        code: { type: String, default: "PKR" }, // PKR, USD, EUR
        symbol: { type: String, default: "₨" },
      },
      tax: {
        isTaxPayerRegistered: { type: Boolean, default: false },
        taxRateCash: { type: Number, default: 0 }, // e.g. 16
        taxRateCard: { type: Number, default: 0 }, // e.g. 16
      },
      template: {
        header: { type: String, default: "" }, // custom header HTML/text
        footer: { type: String, default: "" }, // footer text
        logoUrl: { type: String, default: "" }, // company logo for invoices
      },
      thermalPrint: {
        paperWidth: { type: Number, default: 58 }, // mm, common: 58mm or 80mm
        fontSize: { type: Number, default: 12 },
        showLogo: { type: Boolean, default: true },
      },
      terms:{
        type: String,
      }
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
      },
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
