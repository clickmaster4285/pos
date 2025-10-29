// models/ingredient.model.js
import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    // Core
    name: { type: String, required: true, trim: true },
    SKU: { type: String, unique: true, required: true, uppercase: true , trim: true},
    category: {
      type: String,
      enum: ['produce', 'dairy', 'meat', 'seafood', 'spices', 'dry', 'frozen', 'other'],
      required: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'g', 'lb', 'oz', 'l', 'ml', 'piece'],
      required: true,
    },

    // Cost & Stock
    costPerUnit: { type: Number, required: true, min: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0 },

    // Supplier
    supplier: {
      name: String,
      contact: String,
      leadTime: Number, // days
    },

    // Storage & Expiry
    storage: {
      type: String,
      enum: ['room', 'fridge', 'freezer', 'dry'],
      default: 'room',
    },
    expiryDate: Date,

    // Dynamic or flexible attributes
   metaData: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }, // color , composition , matterial, width etc

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
  { timestamps: true }
);

export default mongoose.model('Ingredient', IngredientSchema);