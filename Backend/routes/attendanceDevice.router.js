import express from "express";
import passport from "../middleware/passportAuth.middleware.js";
import Indexcontroller from "../controllers/indexController.js";
// import { validateRequest } from "../middleware/validation.middleware.js";
// import ZKLib from "zklib-js";

const router = express.Router();

// Validation schemas for each route
const createDeviceSchema = {
  body: {
    companyId: "string|required",
    deviceName: "string|required",
    deviceIp: "string|required|ip",
    devicePort: "number|required|min:1|max:65535",
    serialNumber: "string|optional",
    deviceId: "string|required",
  },
};

const deviceIdParamSchema = {
  params: {
    deviceId: "string|required|mongoId",
  },
};

const syncDeviceSchema = {
  params: { deviceId: "string|required|mongoId" },
  body: { companyId: "string|required" },
};

const initializeFingerprintSchema = {
  params: {
    deviceId: "string|required|mongoId",
    userId: "string|required",
  },
};

router.post(
  "/create-device",
  passport.authenticate("jwt", { session: false }),
  // validateRequest(createDeviceSchema),
  Indexcontroller.AttendanceDevice.createDevice
);
router.get(
  "/get-all-devices",
  passport.authenticate("jwt", { session: false }),
  // validateRequest(createDeviceSchema),
  Indexcontroller.AttendanceDevice.getAllDevices
);
router.put(
  "/connect-device/:deviceId",
  passport.authenticate("jwt", { session: false }),
  // validateRequest(deviceIdParamSchema),
  Indexcontroller.AttendanceDevice.connectDevice
);
router.post(
  "/disconnect-device/:deviceId",
  passport.authenticate("jwt", { session: false }),
  // validateRequest(deviceIdParamSchema),
  Indexcontroller.AttendanceDevice.disconnectDevice
);
router.delete(
  "/delete-device/:deviceId",
  passport.authenticate("jwt", { session: false }),
  // validateRequest(deviceIdParamSchema),
  Indexcontroller.AttendanceDevice.deleteDevice
);
router.patch(
  "/sync-device/:deviceId",
  passport.authenticate("jwt", { session: false }),
  // validateRequest(syncDeviceSchema),
  Indexcontroller.AttendanceDevice.syncDevice
);
router.patch(
  "/sync-attendance/:deviceId",
  passport.authenticate("jwt", { session: false }),
  // validateRequest(syncDeviceSchema),
  Indexcontroller.AttendanceDevice.syncAttendance
);
router.post(
  "/initialize-fingerprint/:deviceId/:userId",
  passport.authenticate("jwt", { session: false }),
  // validateRequest(initializeFingerprintSchema),
  Indexcontroller.AttendanceDevice.initializeFingerprint
);

export default router;
