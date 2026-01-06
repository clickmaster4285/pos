import mongoose, { Schema } from "mongoose";

const BranchSchema = new Schema(
   {
      //compnay id
      // branch unique id gen
      //branh name
      //branh loc
      //   {
      // city, state, zip , country
      // }
      // branch manager [usersid , user delete ]
      // 

   }
);

BranchSchema.index({ name: 1 }, { deleted: false });

export default mongoose.model("Branch", BranchSchema);