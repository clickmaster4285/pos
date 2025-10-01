import mongoose, { Schema } from "mongoose";

const VariantSchema = new Schema({
  variantName: {
    type: String,
    required: [true, "Variant name is required"],
    trim: true,
    maxlength: [100, "Variant name cannot exceed 100 characters"],
  },
  sku: {
    type: String,
    required: [true, "SKU is required"],
    trim: true,
    unique: true,
  },
  incomingQuantity: {
    type: Number,
    required: [true, "Variant incoming quantity is required"],
    min: [0, "Variant incoming quantity cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Variant incoming quantity must be an integer",
    },
  },
  quantity: {
    type: Number,
    default: 0,
    min: [0, "Variant quantity cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Variant quantity must be an integer",
    },
  },
  returnUnder: {
    type: Number,
    default: 5,
    required: [true, "returning days is required"],
  },
  price: {
    type: Number,
    required: [true, "Variant price is required"],
    min: [0, "Variant price cannot be negative"],
    validate: {
      validator: Number.isFinite,
      message: "Variant price must be a valid number",
    },
  },
  costPrice: {
    type: Number,
    min: [0, "Variant cost price cannot be negative"],
    default: 0,
    validate: {
      validator: Number.isFinite,
      message: "Variant cost price must be a valid number",
    },
  },
  attributes: {
    type: Map,
    of: String,
    default: {},
  },
  totalOrdered: {
    type: Number,
    default: 0,
    min: [0, "Total ordered cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Total ordered must be an integer",
    },
  },
  totalReturned: {
    type: Number,
    default: 0,
    min: [0, "Total refunded cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Total refunded must be an integer",
    },
  },
  totalAdjusted: {
    type: Number,
    default: 0,
    min: [0, "Total adjusted cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Total adjusted must be an integer",
    },
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, "Low stock threshold cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Low stock threshold must be an integer",
    },
  },
  lastOrderedDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtuals for computed fields
VariantSchema.virtual("totalSold").get(function () {
  return this.totalOrdered - this.totalReturned;
});

VariantSchema.virtual("remainingQuantity").get(function () {
  return this.quantity;
});

VariantSchema.virtual("totalRevenue").get(function () {
  return this.totalOrdered * this.price;
});

const InventorySchema = new Schema(
  {
    companyId: {
      type: String,
      required: [true, "Company is required"],
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [200, "Item name cannot exceed 200 characters"],
      minlength: [2, "Item name must be at least 2 characters"],
      match: [/^[a-zA-Z0-9\s&.,'-]+$/, "Item name contains invalid characters"],
    },
    itemType: {
      type: String,
      enum: {
        values: ["Part", "Whole", "Other"],
        message: "Invalid item type. Must be Part, Whole, or Other",
      },
      required: [true, "Item type is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    totalVariants: {
      type: Number,
      default: 0,
      min: [0, "Total variants cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total variants must be an integer",
      },
    },
    variants: [VariantSchema],
    quantity: {
      type: Number,
      default: 0,
      min: [0, "Total quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total quantity must be an integer",
      },
    },
    incomingQuantity: {
      type: Number,
      default: 0,
      min: [0, "Total incoming quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total incoming quantity must be an integer",
      },
    },
    price: {
      type: Number,
      min: [0, "Base price cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Base price must be a valid number",
      },
    },
    costPrice: {
      type: Number,
      min: [0, "Base cost price cannot be negative"],
      max: [10000000, "Base cost price cannot exceed 10,000,000"],
      validate: {
        validator: Number.isFinite,
        message: "Base cost price must be a valid number",
      },
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Total price must be a valid number",
      },
    },
    totalCostPrice: {
      type: Number,
      default: 0,
      min: [0, "Total cost price cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Total cost price must be a valid number",
      },
    },
    vendor: {
      type: String,
      trim: true,
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
    createdBy: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    history: [
      {
        action: String,
        performedBy: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
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

// Pre-save hook to synchronize item-level quantities, prices, and ensure unique SKUs
InventorySchema.pre("save", async function (next) {
  // Synchronize total quantity as sum of variant.quantity
  this.quantity = this.variants.reduce((sum, variant) => {
    return sum + (variant.quantity || 0);
  }, 0);

  // Synchronize total incoming quantity
  this.incomingQuantity = this.variants.reduce((sum, variant) => {
    return sum + (variant.incomingQuantity || 0);
  }, 0);

  // Synchronize total variants
  this.totalVariants = this.variants.length;

  // Calculate totalPrice as the sum of (variant.price * variant.quantity)
  this.totalPrice =
    this.variants.length > 0
      ? this.variants.reduce((sum, variant) => {
          return sum + ((variant.price || 0) * (variant.quantity || 0));
        }, 0)
      : this.price || 0; // Fallback to base price if no variants

  // Calculate totalCostPrice as the sum of (variant.costPrice * variant.quantity)
  this.totalCostPrice =
    this.variants.length > 0
      ? this.variants.reduce((sum, variant) => {
          return sum + ((variant.costPrice || 0) * (variant.quantity || 0));
        }, 0)
      : this.costPrice || 0; // Fallback to base cost price if no variants

  // Validate new order-related fields
  this.variants.forEach((variant, index) => {
    if (variant.totalOrdered < 0 || variant.totalReturned < 0 || variant.totalAdjusted < 0) {
      return next(
        new Error(
          `Variant ${index + 1}: Order/refunded/adjusted totals cannot be negative`
        )
      );
    }
    if (variant.remainingQuantity <= variant.lowStockThreshold) {
      console.warn(
        `Low stock alert for variant ${variant.sku}: ${variant.remainingQuantity} remaining (threshold: ${variant.lowStockThreshold})`
      );
    }
  });

  // Ensure unique SKUs across variants
  const skuSet = new Set();
  for (const variant of this.variants) {
    if (skuSet.has(variant.sku)) {
      return next(new Error(`Duplicate SKU found: ${variant.sku}`));
    }
    skuSet.add(variant.sku);
  }

  next();
});

// Ensure unique SKUs across all inventories
InventorySchema.index({ "variants.sku": 1 }, { unique: true });

export default mongoose.model("Inventory", InventorySchema);