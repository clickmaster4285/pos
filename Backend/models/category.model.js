import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema(
  {
    categoryName: {
      type: String,
      trim: true,
      required: [true, "Category name is required"],
    },
    subCategory: [{
      type: String,
      trim: true,
    }],
    companyId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, "Tag cannot exceed 50 characters"],
    }],
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
          enum: ["CREATED", "UPDATED", "DELETED", "ACTIVATED", "DEACTIVATED"],
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




export default mongoose.model("Category", CategorySchema);