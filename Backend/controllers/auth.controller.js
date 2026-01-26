import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import RefreshToken from "../models/RefreshToken.model.js";
import IndexModel from "../models/indexModel.js";
import ErrorResponse from "../utils/errorResponse.js";
import { generateUniqueUserId } from "../utils/generateUniqueUserId.js";
import { generateOTP } from "../utils/generate_verifyOTP.js";
import sendEmail from "../utils/sendEmail.js";
import {
  fetchToolLogoName,
  fetchIndustryName,
} from "../utils/fetchToolLogoName.js";
import { OAuth2Client } from "google-auth-library";
import { generateUniqueCompanyId } from "../utils/generateUniqueCompanyId.js";
import { userActivityLogger } from "../utils/logger.js";
import { getDefaultPermissions } from "../utils/UserPermissionsCatelogs.js";

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // ✅ must be defined
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "postmessage", // ✅ use "postmessage" for code flow from frontend
});

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user.userId,
      role: user.role
    },
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
    httpOnly: true, // true
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // strict
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // true
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // strict
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password, googleId } = req.body;
    let user;
    if (googleId) {
      user = await User.findOne({ googleId: googleId, deleted: false }).select(
        "+password"
      );
      if (!user) {
        return next(new ErrorResponse("Invalid Google credentials", 401));
      }
    }

    if (!email || (!password && !googleId)) {
      return next(
        new ErrorResponse(
          "Please provide email and either password or Google ID",
          400
        )
      );
    }

    user = await User.findOne({ email, deleted: false }).select("+password");
    if (!user) {
      user = await IndexModel.Company.findOne({
        contactEmail: email,
        deleted: false,
      }).select("+password");
      if (!user) {
        return next(new ErrorResponse("Invalid credentials", 401));
      }
      let companyAdmin = await User.findOne({
        userId: user.owner,
        deleted: false,
      }).select("+password");

      if (!companyAdmin) {
        return next(
          new ErrorResponse("Company exist but Company Admin not found", 401)
        );
      }
      user = companyAdmin;
    }
    // console.log("User found:", user.isActive);
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "User or company is deactivated",
      });
    }
    if (!googleId) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return next(new ErrorResponse("Invalid credentials", 401));
      }
    }
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    const toolNameLogo = await fetchToolLogoName();

    const { accessToken, refreshToken } = await generateTokens(user);
    setTokens(res, accessToken, refreshToken);
    let activePlans;
    if (user.role !== "superAdmin") {
      const company = await IndexModel.Company.findOne({
        companyId: user.companyId,
        deleted: false,
        isActive: true,
      }).lean();
      if (!company) {
        return next(
          new ErrorResponse(
            "company not found: you cann't be able to login, Please contact you company Admin",
            401
          )
        );
      }
      // console.log("the user: ", user)

      activePlans = company.plan.find((plan) => plan.isActive === true);
      if (!activePlans) {
        activePlans = company.plan.find(
          (plan) =>
            plan.isActive === false &&
            (plan.status === "not started" || plan.status === "rejected")
        );
      }
    }

    userActivityLogger.info("Auth activity", {
      userId: user.userId,
      action: "POST /api/auth/login",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      statusCode: 200,
    });

    // console.log("🔑 LOGIN DATA:", {
    //   userId: user.userId,
    //   companyId: user.companyId,
    //   role: user.role,
    //   token: accessToken,
    //   refreshToken,
    // });

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
          extraFeature:
            activePlans && user.role !== "superAdmin"
              ? activePlans.limitations.features
              : [],
          toolName: toolNameLogo.toolName,
          toolLogo: toolNameLogo.toolLogo,
          industryName: await fetchIndustryName(user.companyId),
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

const googleSignIn = async (req, res, next) => {
  try {
    const { idToken: code } = req.body;
    if (!code)
      return next(new ErrorResponse("Authorization code required", 400));

    // Exchange authorization code for tokens
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return next(
        new ErrorResponse("Failed to retrieve ID token from Google", 400)
      );
    }

    // Verify ID token (JWT)
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email || !name)
      return next(
        new ErrorResponse("Email OR Name not provided by Google", 400)
      );

    // find or create user
    let user = await User.findOne({ $or: [{ email }, { googleId }] }).select(
      "+password"
    );
    let companyMember;
    if (user) {
      companyMember = await IndexModel.Company.findOne({
        owner: user.userId,
      });
    }
    const isNewUser = !user || !companyMember;
    if (!user) {
      const userId = await generateUniqueUserId(name || "Google User");
      const companyId = await generateUniqueCompanyId(name);
      const permissions = await getDefaultPermissions('admin', companyId);

      user = new User({
        name: name,
        email,
        userId,
        companyId,
        googleId,
        role: "admin",
        verified: true,
        picture,
        password: Math.random().toString(36).slice(-10) + "!@#",
        status: { isaccepted: true, performedBy: "google-oauth" },
        permissions
      });
      await user.save();
    }

    if (isNewUser) {
      if (user && !companyMember) {
        await User.updateOne(
          { userId: user.userId },
          { $set: { googleId: googleId } }
        );
      }
      return res.status(200).json({
        success: true,
        onboarding: true,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          picture: user.picture,
          sub: googleId,
        },
      });
    }

    res.status(200).json({
      success: true,
      onboarding: false,
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          companyId: user.companyId,
          googleId: user.googleId,
        },
      },
    });
  } catch (err) {
    console.error("[auth.controller] Google login error:", err);
    return next(new ErrorResponse("Google authentication failed", 500));
  }
};

const logout = async (req, res, next) => {
  try {
    // 1. Delete refresh token from DB if exists
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    userActivityLogger.info("Auth activity", {
      userId: `Logout user token is: ${req.cookies && req.session
          ? `${JSON.stringify(req.cookies)} and ${JSON.stringify(req.session)}`
          : req.cookies
            ? JSON.stringify(req.cookies)
            : req.session
              ? JSON.stringify(req.session)
              : "No cookies or session"
        }`,
      action: "DELETE /api/auth/logout",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      statusCode: 200,
    });
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

        return res
          .status(200)
          .set({
            "Clear-Site-Data": '"cookies", "storage", "cache"',
            "Cache-Control": "no-store",
          })
          .json({
            success: true,
            message: "Logged out successfully",
            cookiesCleared: true,
          });
      });
    } else {
      // If no session, just clear cookies + respond

      return res
        .status(200)
        .set({
          "Clear-Site-Data": '"cookies", "storage", "cache"',
          "Cache-Control": "no-store",
        })
        .json({
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
    console.log("Fetching user data for userId:", req.user.role);
    const user = await User.findOne({ userId: req.user.userId }).select(
      "userId name email companyId role subRole department permissions isActive"
    );
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }
    const toolNameLogo = await fetchToolLogoName();
    let activePlans;
    if (user.role === "superAdmin") {
      return res.status(200).json({
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
            extraFeature: activePlans?.limitations?.features || [],
            toolName: toolNameLogo.toolName,
            toolLogo: toolNameLogo.toolLogo,
            industryName: await fetchIndustryName(user.companyId),
          },
        },
      });
    }

    const company = await IndexModel.Company.findOne({
      companyId: user.companyId,
      deleted: false,
      isActive: true,
    }).lean();
    if (!company) {
      return next(
        new ErrorResponse(
          "company not found: you cann't be able to login, Please contact you company Admin",
          401
        )
      );
    }

    activePlans = company.plan.find((plan) => plan.isActive === true);
    if (!company) {
      return next(
        new ErrorResponse(
          "the plan are Expired: Please contact you company Admin",
          401
        )
      );
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
          extraFeature: activePlans?.limitations.features || [],
          toolName: toolNameLogo.toolName,
          toolLogo: toolNameLogo.toolLogo,
          industryName: await fetchIndustryName(user.companyId),
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

    const tokenRecord = await RefreshToken.findOne({
      token: refreshToken,
      revoked: false,
    });
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
          message:
            "Failed to send verification email, user creation rolled back",
          error: emailError.message,
        });
      }

      const { accessToken, refreshToken } = await generateTokens(user);
      setTokens(res, accessToken, refreshToken);

      return res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please verify via the OTP sent to your email within 1 minute.",
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
  googleSignIn,
};
