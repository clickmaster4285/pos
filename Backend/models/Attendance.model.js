import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema(
  {
    userId: { type: String, required: true, index: true }, // Reference to User model (alphanumeric userId)
    zkUserId: { type: String, required: true }, // Numeric ID for ZK device
    deviceId: { type: Schema.Types.ObjectId, ref: "AttendanceDevice", required: true },
    companyId: { type: String, required: true, index: true },
    checkTime: { type: Date, required: true },
    type: { type: String, enum: ["checkin", "checkout"], required: true },
    verificationMode: {
      type: String,
      enum: ["fingerprint", "password", "card", "face", "manual"],
      default: "fingerprint",
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AttendanceSchema.index({ userId: 1, checkTime: 1 });
AttendanceSchema.index({ companyId: 1, checkTime: 1 });

export default mongoose.model("Attendance", AttendanceSchema);