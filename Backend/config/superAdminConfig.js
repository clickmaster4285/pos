import mongoose from "mongoose";
import IndexModel from "../models/indexModel.js";
import { generateUniqueUserId } from "../utils/generateUniqueUserId.js";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

const createSuperAdmin = async () => {
  try {
    const superAdminExists = await IndexModel.User.findOne({
      role: "superAdmin",
    });
    if (superAdminExists) {
      console.log("SuperAdmin already exists:", superAdminExists.email);
      return;
    }

    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || "superadmin123@example.com";
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "123";
    const superAdminName = process.env.SUPER_ADMIN_NAME || "Super Admin";

    const superAdmin = new IndexModel.User({
      name: superAdminName,
      userId: await generateUniqueUserId(superAdminName),
      email: superAdminEmail,
      password: superAdminPassword,
      role: "superAdmin",
      verified: true,
      mfaEnabled: false,
      permissions: ["full-access"],
      status: {
        isaccepted: true,
        performedBy: "superAdmin",
      },
      history: [
        {
          action: "Super Admin Create auto",
          performedBy: "superAdmin",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await superAdmin.save();
    console.log("✅ SuperAdmin created successfully:", superAdminEmail);
  } catch (error) {
    console.error("❌ Error creating SuperAdmin:", error.message);
  }
};

export const addStripeConfig = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { publishableKey, secretKey, webhookSigningSecret } = req.body;

    if (role !== "superAdmin") {
      return res.status(403).json({
        message:
          "Unauthorized — only super admins can add or update the Stripe configuration",
      });
    }

    const user = await IndexModel.User.findOne({
      userId,
      deleted: false,
      isActive: true,
      role: "superAdmin",
    });

    if (!user) {
      return res.status(404).json({ message: "Super admin user not found" });
    }

    user.stripeConfig = {
      publishableKey,
      secretKey,
      webhookSigningSecret,
    };

    await user.save();

    return res.status(200).json({
      message: "✅ Stripe configuration added successfully",
      stripeConfig: user.stripeConfig,
    });
  } catch (error) {
    console.error("❌ Error adding Stripe config:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateSuperAdminInfo = async (req, res) => {
  try {
    const { name, email, password, toolName } = req.body || {};
    const userId = req.user.userId;
    const updateData = {};

    // Debugging: Log incoming request data
    console.log("Received request body:", req.body);
    console.log("Received file:", req.file);
    console.log("Authenticated user:", req.user);

    // Validate and process fields
    if (name && name.trim()) {
      updateData.name = name.trim();
    }
    if (toolName && toolName.trim()) {
      updateData.toolName = toolName.trim();
    }
    if (email && email.trim()) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
      updateData.email = email.trim();
    }
    if (password && password.trim()) {
      if (password.trim().length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password.trim(), salt);
    }
    // Handle file upload
    if (req.file) {
      updateData.toolLogo = `/Uploads/tool/${req.file.filename}`;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Update the user
    const updatedUser = await IndexModel.User.findOneAndUpdate(
      { role: "superAdmin", userId }, // Ensure userId matches for security
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        select: "userId name email toolName toolLogo role createdAt",
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "SuperAdmin not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message: "SuperAdmin information updated successfully",
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        toolName: updatedUser.toolName,
        toolLogo: updatedUser.toolLogo,
        userId: updatedUser.userId,
      },
      updatedFields: Object.keys(updateData),
    });
  } catch (error) {
    console.error("❌ Error updating SuperAdmin:", error);

    if (error.code === 11000 || error.name === "MongoError") {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export default createSuperAdmin;
