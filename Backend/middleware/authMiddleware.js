// middleware/authmiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import IndexModel from "../models/indexModel.js";
import speakeasy from "speakeasy";
import ErrorResponse from "../utils/errorResponse.js";
import RefreshToken from "../models/RefreshToken.model.js";

export const authenticateToken = async (req, res, next) => {
  const accessToken = req.cookies.authToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findOne({ userId: decoded.userId }).select(
        "userId role isActive permissions email companyId subRole"
      );

      if (!user || !user.isActive) {
        res.clearCookie("authToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });
        return next(new ErrorResponse("User not found or inactive", 401));
      }

      const tokenRecord = await RefreshToken.findOne({
        token: refreshToken,
        revoked: false,
      });
      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        res.clearCookie("authToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });
        return next(new ErrorResponse("Invalid or expired refresh token", 401));
      }

      await RefreshToken.deleteOne({ token: refreshToken });
      const newAccessToken = jwt.sign(
        { userId: user.userId, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      const newRefreshToken = jwt.sign(
        { userId: user.userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "14d" }
      );

      const tokenRecordNew = new RefreshToken({
        userId: user.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      await tokenRecordNew.save();

      res.cookie("authToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      req.user = user;
      return next();
    } catch (err) {
      res.clearCookie("authToken", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });
      return next(
        new ErrorResponse("Invalid refresh token, please login again", 401)
      );
    }
  }

  if (!accessToken) {
    res.clearCookie("authToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    return next(new ErrorResponse("Access token required, please login", 401));
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId }).select(
      "userId role isActive permissions email companyId subRole"
    );

    if (!user || !user.isActive) {
      res.clearCookie("authToken", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });
      return next(new ErrorResponse("User not found or inactive", 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );
        const user = await User.findOne({ userId: decoded.userId }).select(
          "userId role isActive permissions email companyId subRole"
        );

        if (!user || !user.isActive) {
          res.clearCookie("authToken", { path: "/" });
          res.clearCookie("refreshToken", { path: "/" });
          return next(new ErrorResponse("User not found or inactive", 401));
        }

        const tokenRecord = await RefreshToken.findOne({
          token: refreshToken,
          revoked: false,
        });
        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
          res.clearCookie("authToken", { path: "/" });
          res.clearCookie("refreshToken", { path: "/" });
          return next(
            new ErrorResponse("Invalid or expired refresh token", 401)
          );
        }

        await RefreshToken.deleteOne({ token: refreshToken });
        const newAccessToken = jwt.sign(
          { userId: user.userId, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        const newRefreshToken = jwt.sign(
          { userId: user.userId },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: "14d" }
        );

        const tokenRecordNew = new RefreshToken({
          userId: user.userId,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
        await tokenRecordNew.save();

        res.cookie("authToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 14 * 24 * 60 * 60 * 1000,
        });

        req.user = user;
        return next();
      } catch (refreshError) {
        res.clearCookie("authToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });
        return next(
          new ErrorResponse("Invalid refresh token, please login again", 401)
        );
      }
    }

    res.clearCookie("authToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    return next(
      new ErrorResponse("Invalid or expired token, please login", 401)
    );
  }
};

export const validateRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ userId: decoded.userId }).select(
      "userId role isActive permissions email companyId subRole"
    );

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    const tokenRecord = await RefreshToken.findOne({
      token: refreshToken,
      revoked: false,
    });
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error("Invalid or expired refresh token");
    }

    const newAccessToken = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    const newRefreshToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await RefreshToken.updateOne(
      { token: refreshToken },
      {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: true,
      }
    );
    await RefreshToken.create({
      userId: user.userId,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { newAccessToken, newRefreshToken, user };
  } catch (error) {
    throw new Error(error.message || "Refresh token validation failed");
  }
};

export const require2FA = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.twoFactorAuth.isEnabled) {
      return next();
    }

    const twoFactorToken = req.headers["x-2fa-token"];
    if (!twoFactorToken) {
      return next(new ErrorResponse("2FA token required", 403));
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: "base32",
      token: twoFactorToken,
      window: 2,
    });

    if (!verified) {
      const backupCodeIndex = user.twoFactorAuth.backupCodes.findIndex(
        (code) => code.code === twoFactorToken && !code.used
      );

      if (backupCodeIndex === -1) {
        return next(new ErrorResponse("Invalid 2FA token", 403));
      }

      user.twoFactorAuth.backupCodes[backupCodeIndex].used = true;
      user.twoFactorAuth.backupCodes[backupCodeIndex].usedAt = new Date();
      await user.save({ validateBeforeSave: false });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkplan = (moduleName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const companyId = req.user.companyId;
      if (user.role === "superAdmin") {
        return next();
      }

      const company = await IndexModel.Company.findOne({
        companyId,
        deleted: false,
        isActive: true,
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found or inactive",
        });
      }
      const activePlans = company.plan.filter((plan) => plan.isActive === true);

      if (!activePlans.length) {
        return res.status(403).json({
          success: false,
          message: `Your plan does not include access to ${moduleName}. Please upgrade your plan.`,
        });
      }

      switch (moduleName) {
        case "staffCreate": {
          if (!user.hasPermission?.('staffCreate')) {
            return res.status(403).json({
              success: false,
              message: "Unauthorized: you cannot add staff",
            });
          }
          const availableEmployee = company.gain.staff.length;
          const totalMaxStaff = activePlans.reduce((sum, plan) => {
            return sum + (plan.limitations?.maxStaff || 0);
          }, 0);
          if (availableEmployee >= totalMaxStaff) {
            return res.status(403).json({
              success: false,
              message: `Unauthorized: you reached your plan limit. You can only add ${totalMaxStaff} staff`,
            });
          }
          break;
        }
        case "Vendor": {
          if (!user.hasPermission?.('createVendors')) {
            return res.status(403).json({
              success: false,
              message: "Unauthorized: you cannot manage vendors",
            });
          }
          const availableVendors = company.gain.vendor;
          const totalMaxVendors = activePlans.reduce((sum, plan) => {
            return sum + (plan.limitations?.maxVendors || 0);
          }, 0);
          if (availableVendors >= totalMaxVendors) {
            return res.status(403).json({
              success: false,
              message: `Unauthorized: you reached your plan limit. You can only add ${totalMaxVendors} vendors`,
            });
          }
          break;
        }
        case "Product": {
          if (!user.hasPermission?.('manageProduct')) {
            return res.status(403).json({
              success: false,
              message: "Unauthorized: you cannot manage product",
            });
          }
          const availableProducts = company.gain.product || 0;
          const totalMaxProducts = activePlans.reduce((sum, plan) => {
            return sum + (plan.limitations?.maxProductItems || 0);
          }, 0);
          if (availableProducts >= totalMaxProducts) {
            return res.status(403).json({
              success: false,
              message: `Unauthorized: you reached your plan limit. You can only add ${totalMaxProducts} product items`,
            });
          }
          break;
        }
        default: {
          return res.status(400).json({
            success: false,
            message: `Invalid module: ${moduleName}. Please provide a valid module.`,
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkOrderValidation = async (req, res, next) => {
  try {
    const user = req.user;
    if (
      !user ||
      user.deleted === true ||
      user.isActive === false ||
      !user.userId
    ) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty items array",
      });
    }

    const itemQuantities = items.reduce((acc, item) => {
      const { productItem, quantity } = item;
      if (!productItem || !quantity || quantity <= 0) {
        throw new Error("Invalid product item or quantity");
      }
      acc[productItem] = (acc[productItem] || 0) + quantity;
      return acc;
    }, {});

    for (const [sku, requestedQuantity] of Object.entries(itemQuantities)) {
      const product = await IndexModel.Product.findOne({ sku });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `product item ${sku} not found`,
        });
      }
      if (product.quantity < requestedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Item ${sku} is out of stock. Available: ${product.quantity}, Requested: ${requestedQuantity}`,
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkPermissionsValidation = (moduleName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (user.role === "superAdmin") {
        return next();
      }
      // console.log("Checking permissions for module:", moduleName, user.permissions);
      if (user.permissions?.[moduleName] === true) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: `Unauthorized: you cannot access ${moduleName}`,
        });
      }
    } catch (error) {
      next(error);
    }
  };
};

export const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (user.role === "superAdmin") {
        return next();
      }

      if (user?.hasPermission?.(permissionName)) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: `Unauthorized: you cannot access ${permissionName}`,
        });
      }
    } catch (error) {
      next(error);
    }
  };
};

export const checkPlanIsActive = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role === "superAdmin") {
      return next();
    }
    const company = await IndexModel.Company.findOne({
      companyId: user.companyId,
      deleted: false,
      isActive: true,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found or inactive",
      });
    }
    const activePlans = company.plan.filter((plan) => plan.isActive === true);

    if (activePlans.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Your plan is expired. Please upgrade your plan.",
      });
    }

    return next();
  } catch (error) {
    next(error);
  }
};
