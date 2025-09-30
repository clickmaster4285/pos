// models/addressBookModel.js
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Changed to ObjectId
      required: [true, 'User ID is required'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    alternatePhone: {
      type: String,
    },
    addressLine1: {
      type: String,
      required: [true, 'Address Line 1 is required'],
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
    },
    country: {
      type: String,
      required: [true, 'country is required'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    addressType: {
      type: String,
      enum: {
        values: ['Home', 'Work', 'Office', 'Other'],
        message: '{VALUE} is not a valid address type',
      },
      default: 'Home',
    },
    history: [
      {
        action: {
          type: String,
          required: true,
          enum: ['Created', 'Updated', 'Deleted'],
        },
        performedBy: {
          type: String,
          required: true,
        },
        changes: {
          type: Map,
          of: String, // Store field changes (e.g., { field: "oldValue -> newValue" })
        },
        createdAt: {
          type: Date,
          default: () => new Date().toISOString(),
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('AddressBook', addressSchema);
