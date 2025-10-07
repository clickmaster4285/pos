import ZKLib from "zklib-js";
import IndexModel from "../models/indexModel.js";
import { NotFoundError, InternalServerError } from "../utils/errors.js";

class ZKDeviceService {
  constructor() {
    this.connections = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
  }

  async createZKUser({ name, userId, zkUserId, deviceId, role }) {
    const device = await IndexModel.AttendanceDevice.findById(deviceId);
    if (!device) throw new NotFoundError(`Device ${deviceId} not found`);
    const { deviceIp, devicePort } = device;

    const zk = new ZKLib(deviceIp, devicePort, 10000, 4000);

    try {
      await zk.createSocket();
      const deviceRole = role === "admin" ? 14 : 0;
      const userIdzk = await zk.setUser(parseInt(zkUserId), userId, name.slice(0, 24), "", deviceRole, userId);
      console.log("ZK create user success:", userIdzk);
      await zk.disconnect();
      return zkUserId;
    } catch (err) {
      console.error("ZK create user error:", err);
      throw new InternalServerError(`Failed to create user on device ${deviceId}: ${err.message}`);
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
      throw new InternalServerError(`Failed to delete user from device ${deviceId}: ${err.message}`);
    }
  }

  async connectToDevice(deviceId, retries = 0) {
    try {
      const device = await IndexModel.AttendanceDevice.findById(deviceId);
      if (!device) throw new NotFoundError("Device not found");

      if (
        this.connections.has(deviceId) &&
        this.connections.get(deviceId).isConnected
      ) {
        return this.connections.get(deviceId);
      }

      const zkInstance = new ZKLib(
        device.deviceIp,
        device.devicePort,
        10000,
        4000
      );
      await zkInstance.createSocket();
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

      return connection;
    } catch (error) {
      if (retries < this.maxRetries) {
        const delay = this.retryDelay * 2 ** retries;

        await new Promise((resolve) => setTimeout(resolve, delay));
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
    try {
      const connection = this.connections.get(deviceId);
      if (connection && connection.zkInstance) {
        await connection.zkInstance.disconnect();
        this.connections.delete(deviceId);
        await IndexModel.AttendanceDevice.findByIdAndUpdate(deviceId, {
          status: "disconnected",
          lastSync: new Date(),
        });
      }
    } catch (error) {
      throw new InternalServerError(
        `Failed to disconnect from device: ${error.message}`
      );
    }
  }

  async syncUsersToDevice(deviceId, companyId) {
    let connection;
    try {
      connection = await this.connectToDevice(deviceId);
      const device = await IndexModel.AttendanceDevice.findById(deviceId);
      if (!device) throw new NotFoundError("Device not found");

      // Get device info to check user capacity
      const deviceInfo = await connection.zkInstance.getInfo();
      const maxUserCapacity = deviceInfo.users; // Adjust based on device specs

      const users = await IndexModel.User.find({
        companyId,
        role: "staff",
        deleted: false,
        isActive: true,
      });

      if (users.length > maxUserCapacity) {
        throw new InternalServerError(
          `User count exceeds device capacity of ${maxUserCapacity}`
        );
      }

      let syncedCount = 0;
      let failedCount = 0;
      const failedUsers = [];

      // Get existing users on the device
      const deviceUsers = await connection.zkInstance.getUsers();
      const deviceUserIds = new Set(
        deviceUsers.data.map((u) => u.uid.toString())
      );

      for (const user of users) {
        try {
          // Assign zkUserId if not available
          if (!user.zkUserId) {
            const lastUser = await IndexModel.User.findOne({
              zkUserId: { $regex: "^[0-9]+$" },
            }).sort({ zkUserId: -1 });
            let newZkUserId =
              lastUser && lastUser.zkUserId
                ? parseInt(lastUser.zkUserId) + 1
                : 1;

            // Ensure zkUserId is unique on the device
            while (deviceUserIds.has(newZkUserId.toString())) {
              newZkUserId++;
            }
            user.zkUserId = newZkUserId.toString();
            await user.save();
          }

          // Validate zkUserId
          const zkUserIdNum = parseInt(user.zkUserId);
          if (zkUserIdNum < 1 || zkUserIdNum > 65535) {
            failedCount++;
            failedUsers.push({
              userId: user.userId,
              name: user.name,
              reason: "Invalid zkUserId",
            });
            continue;
          }

          // Check for conflict and resolve
          if (deviceUserIds.has(user.zkUserId)) {
            // Verify if the existing device user matches the database user
            const deviceUser = deviceUsers.data.find(
              (u) => u.uid.toString() === user.zkUserId
            );
            if (
              deviceUser &&
              deviceUser.name === user.name.slice(0, 24) &&
              deviceUser.userId === user.userId &&
              deviceUser.role === (user.role === "admin" ? 14 : 0) &&
              deviceUser.cardNo === (user.cardNumber || user.userId || "0")
            ) {
              user.isSynced = true;
              await user.save();
              syncedCount++;
              continue;
            } else {
              // Resolve conflict by reassigning zkUserId
              const lastUser = await IndexModel.User.findOne({
                zkUserId: { $regex: "^[0-9]+$" },
              }).sort({ zkUserId: -1 });
              let newZkUserId =
                lastUser && lastUser.zkUserId
                  ? parseInt(lastUser.zkUserId) + 1
                  : 1;
              while (deviceUserIds.has(newZkUserId.toString())) {
                newZkUserId++;
              }
              user.zkUserId = newZkUserId.toString();
              await user.save();
            }
          }

          // Ensure all fields are saved in MongoDB
          if (!user.department) {
            user.department = "Not Assigned"; // Default value if department is missing
          }
          if (!user.cardNumber) {
            user.cardNumber = user.userId; // Use userId as cardNumber if not provided
          }
          if (!user.userId) {
            user.userId = `USER${user.zkUserId}`; // Generate userId if missing
          }
          await user.save();

          // Map role to ZK device role (0 = normal user, 14 = admin)
          const deviceRole = user.role === "admin" ? 14 : 0;

          // Set user on the device
          await connection.zkInstance.setUser(
            zkUserIdNum, // UID
            user.userId, // User ID (using userId instead of zkUserId for device userId)
            user.name.slice(0, 24), // Name (limited to 24 chars per device specs)
            "", // Password
            deviceRole, // Role (0 = normal user, 14 = admin)
            user.cardNumber // Card number
          );

          // Verify user was added
          const updatedUsers = await connection.zkInstance.getUsers();
          const userExists = updatedUsers.data.some(
            (u) =>
              u.uid.toString() === user.zkUserId &&
              u.userId === user.userId &&
              u.name === user.name.slice(0, 24) &&
              u.role === deviceRole &&
              u.cardNo === user.cardNumber
          );

          if (userExists) {
            user.isSynced = true;
            await user.save();
            deviceUserIds.add(user.zkUserId); // Update local set to prevent conflicts
            syncedCount++;
          } else {
            failedCount++;
            failedUsers.push({
              userId: user.userId,
              name: user.name,
              reason: "User not found after sync",
            });
          }
        } catch (error) {
          failedCount++;
          failedUsers.push({
            userId: user.userId,
            name: user.name,
            reason: error.message,
          });
        }
      }

      // Update device status
      await IndexModel.AttendanceDevice.findByIdAndUpdate(deviceId, {
        lastSync: new Date(),
        status: failedCount === 0 ? "connected" : "partially_synced",
      });

      return {
        success: failedCount === 0,
        synced: syncedCount,
        failed: failedCount,
        total: users.length,
        failedUsers,
      };
    } catch (error) {
      throw new InternalServerError(`Sync failed: ${error.message}`);
    } finally {
      if (connection) await this.disconnectFromDevice(deviceId);
    }
  }

  async syncUsersToDeviceAttendanceOnly(deviceId, companyId) {
    let connection;
    try {
      connection = await this.connectToDevice(deviceId);
      const deviceUsers = await connection.zkInstance.getUsers();
      const deviceUserIds = new Set(
        deviceUsers.data.map((u) => u.uid.toString())
      );

      const mongoUsers = await IndexModel.User.find({
        companyId,
        deleted: false,
        isActive: true,
      });
      let syncedCount = 0;
      let failedCount = 0;

      for (const user of mongoUsers) {
        if (!user.zkUserId) {
          // Assign zkUserId if not available
          const lastUser = await IndexModel.User.findOne({
            zkUserId: { $regex: "^[0-9]+$" },
          }).sort({ zkUserId: -1 });
          user.zkUserId =
            lastUser && lastUser.zkUserId
              ? (parseInt(lastUser.zkUserId) + 1).toString()
              : "1";
          await user.save();
        }
        if (deviceUserIds.has(user.zkUserId)) {
          syncedCount++;
        } else {
          failedCount++;
        }
      }

      await IndexModel.AttendanceDevice.findByIdAndUpdate(deviceId, {
        lastSync: new Date(),
        status: failedCount === 0 ? "connected" : "disconnected",
      });

      return {
        success: true,
        synced: syncedCount,
        failed: failedCount,
        total: mongoUsers.length,
      };
    } catch (error) {
      throw new InternalServerError(
        `User verification failed: ${error.message}`
      );
    } finally {
      if (connection) await this.disconnectFromDevice(deviceId);
    }
  }

  async initializeFingerprint(deviceId, userId) {
    let connection;
    try {
      connection = await this.connectToDevice(deviceId);
      const user = await IndexModel.User.findOne({ userId });
      if (!user) throw new NotFoundError("User not found");
      if (!user.zkUserId) {
        // Assign zkUserId if not available
        const lastUser = await IndexModel.User.findOne({
          zkUserId: { $regex: "^[0-9]+$" },
        }).sort({ zkUserId: -1 });
        user.zkUserId =
          lastUser && lastUser.zkUserId
            ? (parseInt(lastUser.zkUserId) + 1).toString()
            : "1";
        await user.save();
      }

      // Map role to ZK device role
      const deviceRole = user.role === "admin" ? 14 : 0;
      const cardNumber = user.cardNumber || user.userId || "0";

      await connection.zkInstance.setUser(
        parseInt(user.zkUserId),
        user.userId,
        user.name.slice(0, 24),
        "",
        deviceRole,
        cardNumber
      );

      return {
        success: true,
        message: `Fingerprint enrollment ready for user ${user.name} on device ${deviceId}`,
        userId: user.userId,
        zkUserId: user.zkUserId,
        userName: user.name,
      };
    } catch (error) {
      throw new InternalServerError(
        `Fingerprint enrollment failed: ${error.message}`
      );
    } finally {
      if (connection) await this.disconnectFromDevice(deviceId);
    }
  }

  async syncAttendanceData(deviceId, companyId) {
    let connection;
    try {
      connection = await this.connectToDevice(deviceId);
      const logs = await connection.zkInstance.getAttendances();
      let processedCount = 0;
      let newRecords = 0;
      const newAttendances = [];
      for (const log of logs.data) {
        const user = await IndexModel.User.findOne({
          zkUserId: log.deviceUserId.toString(),
          companyId,
          deleted: false,
        });
        if (user) {
          const existingAttendance = await IndexModel.Attendance.findOne({
            userId: user.userId,
            zkUserId: user.zkUserId,
            deviceId,
            checkTime: new Date(log.timestamp * 1000),
          });

          if (!existingAttendance) {
            const attendanceType = await this.determineAttendanceType(
              user.userId,
              new Date(log.timestamp * 1000)
            );
            newAttendances.push({
              userId: user.userId,
              zkUserId: user.zkUserId,
              deviceId,
              companyId,
              checkTime: new Date(log.timestamp * 1000),
              type: attendanceType,
              verificationMode: "fingerprint",
            });
            newRecords++;
          }
          processedCount++;
        }
      }

      if (newAttendances.length > 0) {
        await IndexModel.Attendance.insertMany(newAttendances);
      }

      await connection.zkInstance.clearAttendanceLog();
      await IndexModel.AttendanceDevice.findByIdAndUpdate(deviceId, {
        lastSync: new Date(),
        status: "connected",
      });

      return {
        success: true,
        processed: processedCount,
        newRecords,
        totalLogs: logs.data.length,
      };
    } catch (error) {
      throw new InternalServerError(`Attendance sync failed: ${error.message}`);
    } finally {
      if (connection) await this.disconnectFromDevice(deviceId);
    }
  }

  async determineAttendanceType(userId, checkTime) {
    const startOfDay = new Date(checkTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkTime);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttendances = await IndexModel.Attendance.find({
      userId,
      checkTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ checkTime: 1 });

    return todayAttendances.length === 0 ||
      todayAttendances[todayAttendances.length - 1].type === "checkout"
      ? "checkin"
      : "checkout";
  }

  async testDeviceConnection(deviceId) {
    let connection;
    try {
      connection = await this.connectToDevice(deviceId);
      const info = await connection.zkInstance.getInfo();
      return {
        success: true,
        deviceInfo: info,
        message: "Device connection test successful",
      };
    } catch (error) {
      return {
        success: false,
        message: `Device connection test failed: ${error.message}`,
      };
    } finally {
      if (connection) await this.disconnectFromDevice(deviceId);
    }
  }
}

export default new ZKDeviceService();
