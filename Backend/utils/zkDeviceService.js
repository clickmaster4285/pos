import events from "events";
import ZKLib from "zklib-js";
import IndexModel from "../models/indexModel.js";
import { NotFoundError, InternalServerError } from "../utils/errors.js";

// Increase default listener limit to avoid warnings from ZKLib internal sockets
events.EventEmitter.defaultMaxListeners = 30;

class ZKDeviceService {
  constructor() {
    this.connections = new Map();
    this.realtimeListeners = new Map();
    this.maxRetries = 5;
    this.retryDelay = 2000;
  }

  // -------------------- CREATE TO ZK --------------------

  async createZKUser({ name, userId, zkUserId, deviceId, role, companyId }) {
    const device = await IndexModel.AttendanceDevice.findById(deviceId);
    if (!device) throw new NotFoundError(`Device ${deviceId} not found`);

    const { deviceIp, devicePort } = device;
    console.log("Creating user on device:", deviceIp, devicePort, {
      name,
      userId,
      zkUserId,
      role,
      companyId,
    });
    const zk = new ZKLib(deviceIp, devicePort, 10000, 4000);

    try {
      await zk.createSocket();
      const deviceRole = role === "admin" ? 14 : 0;

      // Encode companyId and deviceId in cardNumber
      const cardNumber = `${companyId}`;

      await zk.setUser(
        parseInt(zkUserId), // UID
        userId, // userId string
        name.slice(0, 24), // name
        "", // password
        deviceRole, // role
        cardNumber // store companyId + deviceId
      );
      console.log("teh user are created in zk device");
      await zk.disconnect();
      return { zkUserId, deviceId, userId, companyId };
    } catch (err) {
      console.error("ZK create user error:", err);
      throw new InternalServerError(
        `Failed to create user on device ${deviceId}: ${err}`
      );
    }
  }

  async deleteZKUser(zkUserId, deviceId) {
    const device = await IndexModel.AttendanceDevice.findById(deviceId);
    if (!device) throw new NotFoundError(`Device ${deviceId} not found`);
    const { deviceIp, devicePort } = device;

    const zk = new ZKLib(deviceIp, devicePort, 10000, 4000);

    try {
      await zk.createSocket();
      await zk.deleteUser(parseInt(zkUserId));
      await zk.disconnect();
    } catch (err) {
      console.error("ZK delete user error:", err);
      throw new InternalServerError(
        `Failed to delete user from device ${deviceId}: ${err.message}`
      );
    }
  }

  // -------------------- DEVICE CONNECTION --------------------

  async connectToDevice(deviceId, retries = 0) {
    try {
      const device = await IndexModel.AttendanceDevice.findById(deviceId);
      if (!device) throw new NotFoundError("Device not found");

      // ✅ Avoid reconnecting to already connected device
      if (
        this.connections.has(deviceId) &&
        this.connections.get(deviceId).isConnected
      ) {
        console.log(`⚠️ Already connected to device ${device.deviceIp}`);
        return this.connections.get(deviceId);
      }

      const zkInstance = new ZKLib(
        device.deviceIp,
        device.devicePort,
        10000,
        4000
      );
      await zkInstance.createSocket();

      // 🧹 Prevent duplicate event listeners on the same socket
      if (zkInstance.socket) zkInstance.socket.removeAllListeners("data");

      const deviceInfo = await zkInstance.getInfo();

      const connection = {
        zkInstance,
        device,
        isConnected: true,
        lastActivity: new Date(),
        deviceInfo,
      };

      this.connections.set(deviceId, connection);

      await IndexModel.AttendanceDevice.findByIdAndUpdate(deviceId, {
        status: "connected",
        lastSync: new Date(),
      });

      console.log(`✅ Connected to device ${deviceId} (${device.deviceIp})`);
      return connection;
    } catch (error) {
      if (retries < this.maxRetries) {
        const delay = this.retryDelay * 2 ** retries;
        console.log(`🔄 Retry connecting to ${deviceId} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        return this.connectToDevice(deviceId, retries + 1);
      }

      await IndexModel.AttendanceDevice.findByIdAndUpdate(deviceId, {
        status: "disconnected",
      });

      throw new InternalServerError(
        `Failed to connect to device: ${error.message}`
      );
    }
  }

  async disconnectFromDevice(deviceId) {
    const conn = this.connections.get(deviceId);
    if (conn && conn.zkInstance) {
      await conn.zkInstance.disconnect();
      this.connections.delete(deviceId);
      console.log(`🛑 Disconnected from device ${deviceId}`);
    }
  }

  // -------------------- REALTIME LISTENER (polling) --------------------

  async listenForRealTimeAttendance(deviceId) {
    try {
      // console.log(
      //   `🔄 Starting real-time attendance listener for device ${deviceId}`
      // );
      const connection = await this.connectToDevice(deviceId);
      const { zkInstance } = connection;

      if (this.realtimeListeners.has(deviceId)) {
        console.log(`⚠️ Listener already running for ${deviceId}`);
        return;
      }

      // Poll every 5 seconds (stable interval)
const interval = setInterval(async () => {
  try {
    const logs = await zkInstance.getAttendances();
    if (!logs?.data?.length) return;
console.log(`📥 ${Object.keys(logs.data)} logs fetched from ${deviceId}`);
    const validLogs = logs.data.filter(log => {
      // ✅ 1. valid userId characters only
      const validUserId = /^[A-Za-z0-9_-]+$/.test(log.deviceUserId?.trim() || "");


      return validUserId;
    });

    if (validLogs.length === 0) {
      console.warn(`⚠️ Skipping corrupted logs from ${zkInstance.ip}`);
      return;
    }

    console.log(`📥 ${validLogs.length} valid logs received from device ${deviceId}`);

    for (const log of validLogs) {
      await this.processRealTimeAttendance(deviceId, log);
    }

    // Optional: clear logs after confirmed processing
    console.log(`🧹 Clearing attendance logs on device ${deviceId}`);
    await zkInstance.clearAttendanceLog();

  } catch (err) {
    console.error(`❌ Polling error on ${deviceId}:`, err.message);
    await this.handleDeviceError(deviceId, err);
  }
}, 10000);


      this.realtimeListeners.set(deviceId, { interval, zkInstance });
      console.log(`✅ Real-time attendance listener ACTIVE for ${deviceId}`);
    } catch (error) {
      console.error(
        `❌ Failed to start listener for ${deviceId}:`,
        error.message
      );
      await this.attemptReconnection(deviceId);
    }
  }

  async stopRealTimeAttendance(deviceId) {
    const listener = this.realtimeListeners.get(deviceId);
    if (listener) {
      clearInterval(listener.interval);
      this.realtimeListeners.delete(deviceId);
      console.log(`🛑 Stopped real-time listener for ${deviceId}`);
    }
    await this.disconnectFromDevice(deviceId);
  }

  // -------------------- ATTENDANCE PROCESSING --------------------

  async processRealTimeAttendance(deviceId, attendance) {
    try {
      const device = await IndexModel.AttendanceDevice.findById(deviceId);
      if (!device) return console.error(`❌ Device ${deviceId} not found`);
      // Find user by zkUserId + company
      const user = await IndexModel.User.findOne({
        userId: attendance.deviceUserId.toString(),
        companyId: device.companyId,
        deleted: false,
      });

      if (!user) {
        // console.warn(`⚠️ No matching user for zkUserId ${attendance.deviceUserId}`);
        return;
      }

      const checkTime = new Date(attendance.recordTime);
      // ✅ Prevent duplicates: skip if already saved
      const existing = await IndexModel.Attendance.findOne({
        userId: user.userId,
        checkTime: checkTime.toISOString(),
      });
      if (existing) return;

      const type = await this.determineAttendanceType(
        user.userId,
        checkTime.toISOString()
      );

      const attendanceData = {
        userId: user.userId,
        // zkUserId: user.zkUserId,
        companyId: device.companyId,
        deviceId,
        checkTime: checkTime.toISOString(),
        type,
        verificationMode: "fingerprint",
      };

      await IndexModel.Attendance.create(attendanceData);

      console.log(
        `✅ ${user.name} ${type.toUpperCase()} recorded at ${checkTime.toISOString}`
      );
    } catch (err) {
      console.error(`❌ Error saving attendance:`, err.message);
    }
  }

  // -------------------- ERROR HANDLING --------------------

  async handleDeviceError(deviceId, error) {
    await IndexModel.AttendanceDevice.findByIdAndUpdate(deviceId, {
      status: "disconnected",
      lastError: error.message,
    });
    console.error(`❌ Device ${deviceId} error: ${error.message}`);
    await this.attemptReconnection(deviceId);
  }

  async attemptReconnection(deviceId, retry = 0) {
    if (retry >= this.maxRetries) {
      console.error(`❌ Max reconnection attempts for ${deviceId}`);
      return;
    }
    const delay = this.retryDelay * 2 ** retry;
    console.log(`🔁 Reconnecting to ${deviceId} in ${delay}ms`);
    setTimeout(async () => {
      try {
        await this.listenForRealTimeAttendance(deviceId);
        console.log(`✅ Successfully reconnected to ${deviceId}`);
      } catch (err) {
        await this.attemptReconnection(deviceId, retry + 1);
      }
    }, delay);
  }

  // -------------------- CHECKIN / CHECKOUT LOGIC --------------------

  async determineAttendanceType(userId, checkTime) {
    console.log("Determining attendance type for user:", userId, checkTime);
    const start = new Date(checkTime);
    start.setHours(0, 0, 0, 0);
    const end = new Date(checkTime);
    end.setHours(23, 59, 59, 999);

    // Get today's attendance logs sorted by time
    const todayLogs = await IndexModel.Attendance.find({
      userId,
      checkTime: { $gte: start, $lte: end },
    }).sort({ checkTime: 1 });

    // If no record today → first entry must be "checkin"
    if (todayLogs.length === 0) return "checkin";

    const lastLog = todayLogs[todayLogs.length - 1];
    const lastType = lastLog.type;

    // ✅ STEP 1: Prevent duplicate same-time entry
    const diffInSeconds = Math.abs(
      (new Date(checkTime) - new Date(lastLog.checkTime)) / 1000
    );

    if (diffInSeconds < 10) {
      // less than 10 seconds difference → same punch
      console.log("Duplicate scan detected, ignoring...");
      return lastType; // don't change type
    }

    // ✅ STEP 2: Otherwise, alternate the type
    return lastType === "checkin" ? "checkout" : "checkin";
  }
}

export default new ZKDeviceService();
