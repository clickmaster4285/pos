import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    companyId: {
      type: String,
      required: [true, "Company ID is required"],
    },
    productName: {
      type: String,
      unique: true,
      required: [true, "Product name is required"],
    },
    categoryName: {
      type: String,
    },
    subCategory: {
      type: String,
    },
    SKU: { type: String, unique: true, required: [true, "SKU is required"] },
    dynamicAttributes: {
      type: Map, // or Schema.Types.Mixed
      of: Schema.Types.Mixed,
      default: {},
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, "Product quantity cannot be negative"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
    },
    costPrice: {
      type: Number,
      min: [0, "Product cost price cannot be negative"],
      default: 0,
    },
    totalOrdered: {
      type: Number,
      default: 0,
      min: [0, "Total ordered cannot be negative"],
    },
    totalReturned: {
      type: Number,
      default: 0,
      min: [0, "Total refunded cannot be negative"],
    },
    vendor: {
      type: String,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    condition: {
      type: String,
      enum: ["new", "used"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      required: [true, "Creator ID is required"],
      trim: true,
    },
    history: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        details: {
          type: String,
          trim: true,
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("Product", ProductSchema);