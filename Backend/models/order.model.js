import mongoose, { Schema } from "mongoose";

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: [true, "Order number is required"],
      uppercase: true,
      trim: true,
      maxlength: [50, "Order number cannot exceed 50 characters"],
      match: [
        /^[A-Z0-9-]+$/,
        "Order number can only contain uppercase letters, numbers, and hyphens",
      ],
    },
    userId: {
      type: String,
      required: [true, "User is required"],
    },
    companyId: {
      type: String,
      required: [true, "Company ID is required"],
    },
    items: [
      {
        productItem: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product item is required"],
        },
        variantId: {
          type: Schema.Types.ObjectId,
          required: [true, "Variant ID is required"],
        },
        variantName: {
          type: String,
          trim: true,
          required: [true, "Variant name is required"],
          maxlength: [100, "Variant name cannot exceed 100 characters"],
        },
        itemName: {
          type: String,
          trim: true,
          required: [true, "Item name is required"],
          maxlength: [100, "Item name cannot exceed 100 characters"],
        },
        sku: {
          type: String,
          trim: true,
          required: [true, "SKU is required"],
          match: [/^[A-Z0-9-]+$/, "SKU can only contain uppercase letters, numbers, and hyphens"],
        },
        returnUnder: {
          type: Number,
          required: [true, "Return period is required"],
          min: [0, "Return period cannot be negative"],
          validate: {
            validator: Number.isInteger,
            message: "Return period must be an integer",
          },
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
          max: [10000, "Quantity cannot exceed 10,000"],
          validate: {
            validator: Number.isInteger,
            message: "Quantity must be an integer",
          },
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
          validate: {
            validator: Number.isFinite,
            message: "Price must be a valid number",
          },
        },
        costPrice: {
          type: Number,
          min: [0, "Cost price cannot be negative"],
          default: 0,
        },
        total: {
          type: Number,
          required: true,
          min: [0, "Total cannot be negative"],
          validate: {
            validator: Number.isFinite,
            message: "Total must be a valid number",
          },
        },
        status: {
          type: String,
          enum: {
            values: [
              "pending",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
              "returned_request",
              "returned_accept",
              "returned_reject",
            ],
            message:
              "Invalid status. Must be pending, processing, shipped, delivered, cancelled, or returned",
          },
          default: "pending",
        },
        refundAmount: {
          type: Number,
          min: [0, "Refund amount cannot be negative"],
          default: 0,
          validate: {
            validator: Number.isFinite,
            message: "Refund amount must be a valid number",
          },
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Total amount must be a valid number",
      },
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["credit_card", "debit_card", "paypal", "bank_transfer", "cod"],
        message: "Invalid payment method",
      },
      required: [true, "Payment method is required"],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "failed", "refunded", "partially_refunded"],
        message:
          "Invalid payment status. Must be pending, paid, failed, refunded, or partially_refunded",
      },
      default: "pending",
    },
    shippingAddressId: {
      type: String,
      required: [true, "Shipping address is required"],
      match: [/^[0-9a-fA-F]{24}$/, "Invalid shipping address ID format"],
    },
    orderType: {
      type: String,
      enum: {
        values: ["purchase", "service"],
        message: "Invalid order type. Must be purchase or service",
      },
      required: [true, "Order type is required"],
    },
    assignedTo: {
      type: String,
      match: [/^[0-9a-fA-F]{24}$/, "Invalid assigned user ID format"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      match: [/^[\w\s.,!?-]*$/, "Notes can only contain letters, numbers, spaces, and basic punctuation"],
    },
    history: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: { type: String, required: true },
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
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.history; // Hide sensitive history
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual to check if items are returnable
OrderSchema.virtual("isReturnable").get(function () {
  const now = new Date();
  const deliveryEntry = this.history.find((h) =>
    h.action.toLowerCase().includes("delivered")
  );
  if (!deliveryEntry) return false;

  const deliveryDate = new Date(deliveryEntry.createdAt);
  const daysSinceDelivery = (now - deliveryDate) / (1000 * 60 * 60 * 24);

  return this.items.some((item) => {
    if (!item.returnUnder) return false; // Safeguard against missing returnUnder
    // Check if item status allows a return request
    const nonReturnableStatuses = ["cancelled", "returned_accept", "returned_reject"];
    return !nonReturnableStatuses.includes(item.status) && daysSinceDelivery <= item.returnUnder;
  });
});

// Indexes for performance
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ companyId: 1, deleted: 1 });
OrderSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL for 30 days

// Validate items belong to the same company
OrderSchema.pre("validate", async function (next) {
  if (this.items?.length) {
    const productIds = this.items.map((item) => item.productItem);

    const inventories = await mongoose
      .model("Product")
      .find({ _id: { $in: productIds } })
      .select("companyId");

    const mismatch = inventories.find(
      (inv) => inv.companyId.toString() !== this.companyId.toString()
    );

    if (mismatch) {
      return next(new Error("All items must belong to the same company as the order"));
    }
  }
  next();
});

// Ensure totalAmount matches sum of item totals for non-cancelled and non-returned items
OrderSchema.pre("validate", function (next) {
  if (this.items?.length) {
    const calculatedTotal = this.items.reduce((sum, item) => {
      if (!["cancelled", "returned_accept"].includes(item.status)) {
        return sum + (item.total || 0);
      }
      return sum;
    }, 0);

    if (Math.abs(calculatedTotal - (this.totalAmount || 0)) > 0.01) {
      return next(new Error("Total amount must match the sum of non-cancelled and non-returned item totals"));
    }
  }
  next();
});

// Prevent updates to immutable fields
OrderSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("orderNumber")) {
    return next(new Error("Order number cannot be modified after creation"));
  }
  next();
});

export default mongoose.model("Order", OrderSchema);