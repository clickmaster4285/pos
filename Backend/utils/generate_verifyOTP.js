import bcrypt from 'bcrypt';
import IndexModel from "../models/indexModel.js";

export const generateOTP = async () => {
  const otp = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit OTP
  const hashedOTP = await bcrypt.hash(otp, 12);
  return { otp, hashedOTP };
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required",
      });
    }

    const user = await IndexModel.User.findOne({
      email,
      deleted: false,
    }).select("+verificationOTP +verificationExpiry");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.verificationOTP || user.verificationExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        error: "OTP is invalid or expired",
      });
    }

    const isMatch = await bcrypt.compare(otp, user.verificationOTP);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Incorrect OTP",
      });
    }

    // ✅ Verify user
    user.verified = true;
    user.verificationOTP = undefined;
    user.verificationExpiry = undefined;

    // ✅ Add to history
    user.history = user.history || [];
    user.history.push({
      action: "Admin/Company verified OTP",
      performedBy: user.userId, // or req.user._id if coming from token/session
      performedAt: new Date(),
    });

    await user.save();

    // ✅ Activate company
    const company = await IndexModel.Company.findOne({
      owner: user.userId,
      deleted: false,
    });
    if (company) {
      company.isActive = true;

      company.history = company.history || [];
      company.history.push({
        action: "Company activated after OTP verification",
        performedBy: user.userId,
        performedAt: new Date(),
      });

      await company.save();
    }

    return res.status(200).json({
      success: true,
      message: "Account verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error during verification",
      details: error.message,
    });
  }
};