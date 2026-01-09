import mongoose, { Schema } from "mongoose";

const AddressSchema = new Schema(
   {
      street: { type: String, trim: true },
      city: { type: String, trim: true, required: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "Pakistan" },
   },
   { _id: false }
);

const BranchSchema = new Schema(
   {
      companyId: { type: String, required: true, index: true },
      branchId: { type: String, required: true, index: true },
      branch_Name: { type: String, required: true, index: true },
      address: {
         type: AddressSchema,
         required: [true, "Address is required"]
      },
      branch_Manager: [{
         userId: { type: String, }, 
      }],
      
      deleted: { type: Boolean, default: false },
      createdBy: { type: String, required: true },
      updatedBy: { type: String }
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
   }
);

BranchSchema.index({ name: 1 }, { deleted: false });

export default mongoose.model("Branch", BranchSchema);