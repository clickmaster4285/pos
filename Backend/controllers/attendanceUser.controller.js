import IndexModel from "../models/indexModel.js";
import ZKLib from "zklib-js";

export default {
  checkin: async (req, res) => {
    try {
      const { userId, deviceId, verificationMode = "manual" } = req.body;
      const user = await IndexModel.User.findOne({ userId });
      if (!user) return res.status(404).json({ message: "User not found" });
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

      const device = await IndexModel.AttendanceDevice.findById(deviceId);
      if (!device) return res.status(404).json({ message: "Device not found" });

      const attendance = await IndexModel.Attendance.create({
        userId,
        zkUserId: user.zkUserId,
        deviceId,
        companyId: user.companyId,
        checkTime: new Date(),
        type: "checkin",
        verificationMode,
      });

      res.status(200).json({ message: "Check-in recorded", attendance });
    } catch (err) {
      res.status(500).json({ message: `Check-in failed: ${err.message}` });
    }
  },

  checkout: async (req, res) => {
    try {
      const { userId, deviceId, verificationMode = "manual" } = req.body;
      const user = await IndexModel.User.findOne({ userId });
      if (!user) return res.status(404).json({ message: "User not found" });
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

      const device = await IndexModel.AttendanceDevice.findById(deviceId);
      if (!device) return res.status(404).json({ message: "Device not found" });

      const attendance = await IndexModel.Attendance.create({
        userId,
        zkUserId: user.zkUserId,
        deviceId,
        companyId: user.companyId,
        checkTime: new Date(),
        type: "checkout",
        verificationMode,
      });

      res.status(200).json({ message: "Check-out recorded", attendance });
    } catch (err) {
      res.status(500).json({ message: `Check-out failed: ${err.message}` });
    }
  },

  getAllAttendance: async (req, res) => {
    const { deviceId } = req.params;
    const device = await IndexModel.AttendanceDevice.findById(deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const { deviceIp, devicePort } = device;
    let zkInstance;

    try {
      // 1️⃣ Connect to device
      zkInstance = new ZKLib(deviceIp, devicePort, 10000, 4000);
      await zkInstance.createSocket();
      console.log(`✅ Connected to device at ${deviceIp}`);

      // 2️⃣ Get users from device
      const users = await zkInstance.getUsers();
      console.log("📋 Users fetched:", users);

      // 3️⃣ Get attendance logs
      const logs = await zkInstance.getAttendances();
      console.log("📋 Logs fetched:", logs?.data?.length);

      // 4️⃣ Merge name + logs
      const mergedLogs = logs.data.map((log) => {
        const matchedUser = users.data.find(
          (u) => u.userId === log.deviceUserId.toString()
        );
        return {
          ...log,
          name: matchedUser ? matchedUser.name : "Unknown",
        };
      });

      // 5️⃣ Sort (latest first)
      const sortedLogs = mergedLogs.sort(
        (a, b) => new Date(b.recordTime) - new Date(a.recordTime)
      );

      // 6️⃣ Respond
      res.status(200).json({
        message: "Attendance fetched successfully",
        attendances: sortedLogs,
        count: sortedLogs.length,
      });

      // 7️⃣ Disconnect
      await zkInstance.disconnect();
      console.log("🔌 Disconnected from device");
    } catch (err) {
      console.error("❌ Error fetching attendance:", err.message);
      if (zkInstance) await zkInstance.disconnect().catch(() => {});
      res
        .status(500)
        .json({ message: `Failed to fetch attendance: ${err.message}` });
    }
  },

  getAttendanceByUid: async (req, res) => {
    const { deviceId, userId } = req.params; // userId = device user ID (e.g. '1012')
    const device = await IndexModel.AttendanceDevice.findById(deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const { deviceIp, devicePort } = device;
    let zkInstance;

    try {
      // 1️⃣ Connect to device
      zkInstance = new ZKLib(deviceIp, devicePort, 10000, 4000);
      await zkInstance.createSocket();
      console.log(`✅ Connected to ${deviceIp}`);

      // 2️⃣ Fetch all attendance logs
      const logs = await zkInstance.getAttendances();
      console.log(`📋 Total logs fetched: ${logs?.data?.length}`);

      // 3️⃣ Filter logs for the given userId
      const userLogs = logs.data.filter(
        (log) => log.deviceUserId.toString() === userId.toString()
      );

      // 4️⃣ Sort by recordTime (latest first)
      const sortedLogs = userLogs.sort(
        (a, b) => new Date(b.recordTime) - new Date(a.recordTime)
      );

      // 5️⃣ Optional: add user name
      const users = await zkInstance.getUsers();
      const matchedUser = users.data.find(
        (u) => u.userId.toString() === userId.toString()
      );

      // 6️⃣ Response
      res.status(200).json({
        message: "Attendance fetched successfully",
        user: matchedUser ? matchedUser.name : "Unknown",
        userId,
        count: sortedLogs.length,
        attendances: sortedLogs,
      });

      // 7️⃣ Disconnect
      await zkInstance.disconnect();
      console.log("🔌 Disconnected from device");
    } catch (err) {
      console.error("❌ Error fetching user attendance:", err.message);
      if (zkInstance) await zkInstance.disconnect().catch(() => {});
      res.status(500).json({
        message: `Failed to fetch attendance: ${err.message}`,
      });
    }
  },
};
