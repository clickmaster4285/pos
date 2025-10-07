import mongoose, { Schema } from "mongoose";

const AttendanceDeviceSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    deviceName: { type: String, required: true },
    deviceIp: { type: String, required: true },
    devicePort: { type: Number, required: true, default: 4370 },
    serialNumber: { type: String, index: true },
    deviceId: { type: String, required: true },
    firmwareVersion: { type: String },
    macAddress: { type: String },
    lastSync: { type: Date },
    status: { type: String, enum: ["connected", "disconnected"], default: "disconnected" },
    createdby: { type: String },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("AttendanceDevice", AttendanceDeviceSchema);