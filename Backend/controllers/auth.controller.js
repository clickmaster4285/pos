import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import RefreshToken from "../models/RefreshToken.model.js";
import IndexModel from "../models/indexModel.js";
import ErrorResponse from "../utils/errorResponse.js";
import { generateUniqueUserId } from "../utils/generateUniqueUserId.js";
import { generateOTP } from "../utils/generate_verifyOTP.js";
import sendEmail from "../utils/sendEmail.js";

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { userId: user.userId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  const refreshToken = jwt.sign(
    { userId: user.userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "14d" }
  );

  const tokenRecord = new RefreshToken({
    userId: user.userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });
  await tokenRecord.save();

  return { accessToken, refreshToken };
};

const setTokens = (res, accessToken, refreshToken) => {
  res.cookie("authToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse("Please provide email and password", 400));
    }

    const user = await User.findOne({ email, deleted:false }).select("+password");
    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }
    console.log("User found:", user.isActive);
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "User or company is deactivated",
      });
    }
    if (user.status?.isaccepted === "pending") {
      return res.status(401).json({
        success: false,
        message: "User approval is still pending",
      });
    }

    if (user.status?.isaccepted === "false") {
      return res.status(401).json({
        success: false,
        message: `User was rejected by ${user.status?.performedBy}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateTokens(user);
    setTokens(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      status: 200,
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          companyId: user.companyId,
          role: user.role,
          subRole: user.subRole,
          department: user.department,
          permissions: user.permissions,
          isActive: user.isActive,
        },
        token: accessToken,
        refreshToken, 
      },
    });
  } catch (error) {
    console.error("[auth.controller] Error during login:", error);
    return next(new ErrorResponse("Server error during login", 500));
  }
};

const logout = async (req, res, next) => {
  try {
    // 1. Delete refresh token from DB if exists
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    // 2. Clear all cookies sent from client
    if (req.cookies) {
      Object.keys(req.cookies).forEach((cookieName) => {
        res.clearCookie(cookieName, { path: "/" });
      });
    }

    // 3. Destroy the session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({
            success: false,
            message:
              "Logout failed - session could not be destroyed. Please clear browser cookies manually.",
          });
        }

        // 4. Tell browser to clear site data (cookies, storage, cache)
        return res.status(200).set({
          "Clear-Site-Data": '"cookies", "storage", "cache"',
          "Cache-Control": "no-store",
        }).json({
          success: true,
          message: "Logged out successfully",
          cookiesCleared: true,
        });
      });
    } else {
      // If no session, just clear cookies + respond
      return res.status(200).set({
        "Clear-Site-Data": '"cookies", "storage", "cache"',
        "Cache-Control": "no-store",
      }).json({
        success: true,
        message: "Logged out successfully",
        cookiesCleared: true,
      });
    }
  } catch (error) {
    console.error("[auth.controller] Error during logout:", error);
    return next(new ErrorResponse("Server error during logout", 500));
  }
};


const getme = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select(
      "userId name email companyId role subRole department permissions isActive"
    );
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.userId,
          name: user.name,
          email: user.email,
          companyId: user.companyId,
          role: user.role,
          subRole: user.subRole,
          department: user.department,
          permissions: user.permissions,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("[auth.controller] Error fetching user:", error);
    return next(new ErrorResponse("Server error fetching user data", 500));
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(new ErrorResponse("Refresh token required", 401));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ userId: decoded.userId }).select(
      "userId role isActive permissions email companyId subRole name department"
    );

    if (!user || !user.isActive) {
      return next(new ErrorResponse("User not found or inactive", 401));
    }

    const tokenRecord = await RefreshToken.findOne({ token: refreshToken, revoked: false });
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return next(new ErrorResponse("Invalid or expired refresh token", 401));
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    const { accessToken, newRefreshToken } = await generateTokens(user);
    setTokens(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.userId,
          name: user.name,
          email: user.email,
          companyId: user.companyId,
          role: user.role,
          subRole: user.subRole,
          department: user.department,
          permissions: user.permissions,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("[auth.controller] Error refreshing token:", error);
    return next(new ErrorResponse("Invalid or expired refresh token", 401));
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await IndexModel.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const userId = await generateUniqueUserId(name);

    const user = new IndexModel.User({
      name,
      userId,
      email,
      password,
      role: "user",
      phone,
      address,
      verified: false,
      status: {
        isaccepted: "true",
        performedBy: userId,
        updatedAt: Date.now(),
      },
      history: [
        {
          action: "Customer registered",
          performedBy: userId,
          performedAt: new Date(),
        },
      ],
    });

    const { otp, hashedOTP } = await generateOTP();
    user.verificationOTP = hashedOTP;
    user.verificationExpiry = Date.now() + 1 * 60 * 1000;

    try {
      await user.save();

      try {
        await sendEmail({
          email: user.email,
          subject: "Verify Your Account",
          template: "emailVerification",
          data: { name: user.name, otp },
        });
      } catch (emailError) {
        await IndexModel.User.findByIdAndDelete(user._id);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email, user creation rolled back",
          error: emailError.message,
        });
      }

      const { accessToken, refreshToken } = await generateTokens(user);
      setTokens(res, accessToken, refreshToken);

      return res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify via the OTP sent to your email within 1 minute.",
        data: {
          id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (saveError) {
      await IndexModel.User.findByIdAndDelete(user._id);
      return res.status(400).json({
        success: false,
        message: "Failed to create user, creation rolled back",
        error: saveError.message,
      });
    }
  } catch (error) {
    console.error("[auth.controller] Error registering user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while registering user",
      error: error.message,
    });
  }
};

export default {
  login,
  logout,
  getme,
  refreshToken,
  registerUser,
};