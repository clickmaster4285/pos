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



  };
