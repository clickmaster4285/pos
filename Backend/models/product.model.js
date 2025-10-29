// models/product.model.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },

    // Core
    productName: { type: String, required: true, trim: true },
    SKU: { type: String, unique: true, required: true, uppercase: true },
    description: { type: String, trim: true, maxlength: 1000 },
    tags: [{ type: String, trim: true }],

    // Category
    category: { type: String,  },
    subCategoryName: { type: String, trim: true },

    // Vendor (optional)
    vendor: { type: String,  },

    // Ingredients
    ingredient: [{ type: String,}],

    // Pricing & Stock
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0 },

    // Status
    isActive: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },

    // Audit
    createdBy: { type: String, required: true },
    history: [
      {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);




export default mongoose.model("Product", ProductSchema);