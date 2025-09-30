import mongoose, { Schema } from "mongoose";

const HistorySchema = new Schema(
  {
    action: {
      type: String,
      required: true,
    },
    performedBy: {
      type: String,
      required: true,
    },
    previousData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    newData: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("History", HistorySchema);
