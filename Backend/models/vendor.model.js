import mongoose, { Schema } from "mongoose";

const VendorSchema = new Schema(
  {
    name: {
      type: String,
    },
    contactName: {
      type: String,
    },
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,63})+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
    },
    address: {
      type: String,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    companyId: {
      type: String,
      required: [true, "Company is required"],
    },
    // suppliedItems: [
    //   {
    //     type: String,
    //   },
    // ],
    paymentType: {
      type: String,
      enum: ["Cash", "EasyPeisa", "Bank", "Other"],
    },
    createdBy: {
      type: String,
    },
    isActive: {
      type: Boolean,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
// VendorSchema.index({ name: 1, companyId: 1 });
// VendorSchema.index({ createdBy: 1, isActive: 1 });

export default mongoose.model("Vendor", VendorSchema);
