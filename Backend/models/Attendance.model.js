import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema(
  {
    userId: { type: String, required: true, index: true }, // Reference to User model (alphanumeric userId)
    zkUserId: { type: String }, // Numeric ID for ZK device
    deviceId: { type: String },
    companyId: { type: String, },
    checkTime: { type: Date, default: Date.now, required: true },
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