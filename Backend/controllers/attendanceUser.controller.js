  import IndexModel from "../models/indexModel.js";
  import ZKLib from "zklib-js";

  export default {
    getAllAttendance: async (req, res) => {
  try {
    const { companyId } = req.user;

    // 1️⃣ Fetch attendance records for the company
    const attendanceRecords = await IndexModel.Attendance.find({ companyId })
      .sort({ createdAt: -1 });

    // 2️⃣ Check if no attendance records found
    if (!attendanceRecords.length) {
      return res.status(404).json({
        message: "No attendance records found",
        success: false,
      });
    }

    // 3️⃣ Extract all unique userIds from attendance records
    const userIds = [...new Set(attendanceRecords.map(a => a.userId))];

    // 4️⃣ Fetch all users in one query
    const users = await IndexModel.User.find({ userId: { $in: userIds } });

    // 5️⃣ Combine user info into attendance records
    const attendanceWithUser = attendanceRecords.map(a => {
      const user = users.find(u => u.userId === a.userId);
      return {
        ...a.toObject(),
        userName: user ? user.name : "Unknown User",
      };
    });

    // 6️⃣ Send response
    res.status(200).json({
      message: "Attendance fetched successfully",
      data: attendanceWithUser,
      success: true,
    });

  } catch (err) {
    console.error("❌ Error fetching attendance:", err.message);
    res.status(500).json({
      message: `Failed to fetch attendance: ${err.message}`,
      success: false,
    });
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
