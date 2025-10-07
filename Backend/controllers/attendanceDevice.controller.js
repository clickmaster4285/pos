import ZKDeviceService from "../utils/zkDeviceService.js";
import IndexModel from "../models/indexModel.js";
import { NotFoundError, InternalServerError } from "../utils/errors.js";
import ZKLib from "zklib-js";

export default {
  /**
   * @desc Create a new attendance device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createDevice: async (req, res) => {
    try {
      const { companyId, userId } = req.user;
      const device = new IndexModel.AttendanceDevice({
        ...req.body,
        companyId,
        createdby: userId,
      });
      await device.save();
      res.status(201).json({ message: "Device created successfully", device });
    } catch (err) {
      throw new InternalServerError(`Failed to create device: ${err.message}`);
    }
  },

  getAllDevices: async (req, res) => {
    try {
      const { companyId } = req.user;

      // Fetch all non-deleted attendanceDevices for this company
      const attendanceDevices = await IndexModel.AttendanceDevice.find({
        companyId,
        deleted: false,
      }).lean();

      return res
        .status(200)
        .json({
          data: attendanceDevices,
          success: true,
          message: "Attendance devices fetched successfully",
        });
    } catch (error) {
      console.error("Error fetching attendanceDevices:", error);
      return res.status(400).json({
        message: "Error fetching attendanceDevices",
        error: error.message,
      });
    }
  },

  /**
   * @desc Connect to an attendance device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  connectDevice: async (req, res) => {
    try {
      const { deviceId } = req.params;
      const device = await IndexModel.AttendanceDevice.findById(deviceId);
      if (!device) throw new NotFoundError("Device not found");

      const result = await ZKDeviceService.connectToDevice(deviceId);
      res.json({
        success: true,
        message: "Device connected successfully",
        deviceInfo: result.deviceInfo,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * @desc Disconnect an attendance device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  disconnectDevice: async (req, res) => {
    try {
      const { deviceId } = req.params;
      const device = await IndexModel.AttendanceDevice.findById(deviceId);
      if (!device) throw new NotFoundError("Device not found");

      await ZKDeviceService.disconnectFromDevice(deviceId);
      res
        .status(200)
        .json({ message: "Device disconnected successfully", device });
    } catch (err) {
      throw new InternalServerError(`Disconnection failed: ${err.message}`);
    }
  },

  /**
   * @desc Delete an attendance device (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteDevice: async (req, res) => {
    try {
      const { deviceId } = req.params;
      const device = await IndexModel.AttendanceDevice.findByIdAndUpdate(
        deviceId,
        { deleted: true },
        { new: true }
      );
      if (!device) throw new NotFoundError("Device not found");
      res.status(200).json({ message: "Device deleted successfully", device });
    } catch (err) {
      throw new InternalServerError(`Deletion failed: ${err.message}`);
    }
  },

  /**
   * @desc Sync users to an attendance device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  syncDevice: async (req, res) => {
    const { deviceId } = req.params;
    try {
      const { companyId } = req.user; // Use req.user as in provided file
      // Option 1: Use syncUsersToDeviceAttendanceOnly (for node-zklib)
      // const result = await ZKDeviceService.syncUsersToDeviceAttendanceOnly(deviceId, companyId);

      // Option 2: Use syncUsersToDevice (for node-zklib-toolkit)
      const result = await ZKDeviceService.syncUsersToDevice(
        deviceId,
        companyId
      );

      res.json({ message: "Device sync completed", result });
    } catch (error) {
      throw error;
    }
  },

  /**
   * @desc Sync attendance data from a device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  syncAttendance: async (req, res) => {
    const { deviceId } = req.params;
    try {
      const { companyId } = req.user;
      const result = await ZKDeviceService.syncAttendanceData(
        deviceId,
        companyId
      );
      res.json({ message: "Attendance sync completed", result });
    } catch (error) {
      throw error;
    }
  },

  /**
   * @desc Initialize fingerprint for a user on a device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  initializeFingerprint: async (req, res) => {
    try {
      const { deviceId, userId } = req.params;
      const result = await ZKDeviceService.initializeFingerprint(
        deviceId,
        userId
      );
      res.json({ message: "Fingerprint initialized successfully", result });
    } catch (error) {
      throw error;
    }
  },
};
