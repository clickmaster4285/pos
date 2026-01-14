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
      enum: ["Cash", "EasyPaisa", "Bank", "Other"],
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

export default mongoose.model("Vendor", VendorSchema);
