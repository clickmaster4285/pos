import mongoose from "mongoose";
import IndexModel from "../models/indexModel.js";
import { generateUniqueUserId } from "../utils/generateUniqueUserId.js";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import { generateUniqueCompanyId } from "../utils/generateUniqueCompanyId.js";
import { generatePlanId } from "../utils/generatePlanIdPurchased.js";

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
      toolName: "SmartPOS",
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
    const updateData = {};

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
      { role: "superAdmin" }, // Ensure userId matches for security
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

export const createCompanybySuperAdmin = async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== "superAdmin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized: Only super admins can create companies",
      });
    }
    const { company, admin } = req.body;

    // Validate required fields
    if (!company || !company.name || !company.contactEmail || !company.plan) {
      return res.status(400).json({
        success: false,
        error: "Company name, contact email, and plan are required",
      });
    }

    if (!admin || !admin.name || !admin.email || !admin.password) {
      return res.status(400).json({
        success: false,
        error: "Admin name, email, and password are required",
      });
    }
    // console.log("the logs is : io am her")

    // console.log("the availablePlan", company.plan)
    const availablePlan = await IndexModel.Plan.findById(company.plan);
    // console.log("the availablePlan", availablePlan)
    if (
      !availablePlan ||
      availablePlan.deleted === true ||
      availablePlan.isActive === false
    ) {
      return res.status(400).json({
        success: false,
        error: "plan does not exist or deactivated: contact support",
      });
    }
    if (company.plan !== availablePlan.id) {
      return res.status(400).json({
        success: false,
        error: "plan does not exist or deactivated: contact support",
      });
    }
    // Generate unique companyId
    const companyId = await generateUniqueCompanyId(company.name);

    const user_Id = await generateUniqueUserId(admin.name);
    // Create company
    const newCompany = new IndexModel.Company({
      name: company.name,
      companyId,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      address: company.address,
      industryName: company.industryName,
      isActive: true,
      plan: {
        planId: await generatePlanId(companyId, user_Id),
        status: "in progress",
        ...availablePlan,
        isActive: true,
      },
      history: [
        {
          action: `Super Company created ${userId}`,
          performedBy: userId,
        },
      ],
      isActive: true,
      owner: user_Id, // to be set after admin user creation
    });
    // Create admin user
    const adminUser = new IndexModel.User({
      name: admin.name,
      email: admin.email,
      password: admin.password,
      role: "admin",
      companyId: newCompany.companyId,
      userId: user_Id,
      address: admin.address,
      Phone: admin.phone,
      status: {
        isaccepted: "true",
        performedBy: `Super Admin created ${userId}`,
        updatedAt: new Date(),
      },
      isActive: true,
      permissions: {
        approveRequests: true,
        assignTasks: true,
        manageAppointments: true,
        createProduct: true,
        updateProduct: true,
        viewProduct: true,
        deleteProduct: true,
        managePlans: true,
        manageTeams: true,
        createVendors: true,
        updateVendors: true,
        deleteVendors: true,
        viewVendors: true,
        staffCreate: true,
        staffDelete: true,
        staffUpdate: true,
        viewReports: true,
        viewallstaff: true,
        editBilling: true,
        deleteBilling: true,
        addBilling: true,
        viewBilling: true,
        createPayment: true,
        viewAllStaffSalaries: true,
        updateSalary: true,
        deletePayment: true,
        staffSummary: true,
        viewActiveLog: true,
        viewCompanySummary: true,
        companyprofileupdate: true,
      },
      history: [
        {
          action: "Admin created by SuperAdmin",
          performedBy: userId,
        },
      ],
      verified: true,
    });

    console.log("the newCompany is : ", adminUser, newCompany.owner);
    // Set company owner to admin user's userId
    newCompany.owner = adminUser.userId;

    // Save company first
    await newCompany.save();

    try {
      // Try to save admin
      await adminUser.save();
    } catch (adminError) {
      // If admin creation fails, delete the created company
      await IndexModel.Company.findByIdAndDelete(newCompany._id);
      return res.status(400).json({
        success: false,
        error: "Failed to create admin, company creation rolled back",
        details: adminError.message,
      });
    }

    // Return response with populated data
    const populatedCompany = await IndexModel.Company.findById(newCompany._id)
      .populate("owner", "name email userId")
      .populate("plan");

    return res.status(201).json({
      success: true,
      data: {
        companyId: populatedCompany,
        admin: {
          userId: adminUser.userId,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
      },
      message:
        "Company and admin created. Please verify via the OTP sent to your email within 1 minute.",
    });
  } catch (error) {
    // Handle specific errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Company name, company ID, or admin email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server error while creating company and admin",
      details: error.message,
    });
  }
};



export const superAdminDashboard = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "superAdmin") {
      return res.status(403).json({
        message: "Unauthorized — only super admins can access this data",
      });
    }

    // ===============================
    // 1️⃣ Basic dashboard data
    // ===============================
    const companies = await IndexModel.Company.find({ deleted: false }).lean();
    const admins = await IndexModel.User.find({
      role: "admin",
      deleted: false,
    }).lean();
    const pendingVerifications = await IndexModel.User.find({
      "status.isaccepted": "false",
      deleted: false,
    }).lean();
    const staff = await IndexModel.User.find({
      role: "staff",
      isActive: true,
      deleted: false,
    }).lean();

    // 💰 Total revenue
    const totalRevenue = companies.reduce((acc, company) => {
      const planSum = (company.plan || []).reduce(
        (sum, p) => sum + (p.price || 0),
        0
      );
      return acc + planSum;
    }, 0);

    // 📦 Active plans
    const totalActivePlan = companies.reduce((count, company) => {
      const activePlans = (company.plan || []).filter((p) => p.isActive);
      return count + activePlans.length;
    }, 0);

    const activeCompanies = companies.filter((c) => c.isActive).length;
    const suspendedCompanies = companies.filter((c) => !c.isActive).length;

    const recentCompanies = await IndexModel.Company.find({ deleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name companyId plan createdAt");

    // ===============================
    // 2️⃣ MongoDB storage stats
    // ===============================
    const dbStats = await IndexModel.Company.db.db.stats();
    const mongoStorageUsedMB = dbStats.storageSize / (1024 * 1024); // MB
    const mongoDataSizeMB = dbStats.dataSize / (1024 * 1024); // MB

    // ===============================
    // 3️⃣ Uploads folder size
    // ===============================
    const getFolderSize = (folderPath) => {
      let totalSize = 0;
      const files = fs.readdirSync(folderPath);

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          totalSize += getFolderSize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
      return totalSize;
    };

    const uploadsPath = path.join(process.cwd(), "Uploads");
    let uploadsSizeMB = 0;

    if (fs.existsSync(uploadsPath)) {
      const bytes = getFolderSize(uploadsPath);
      uploadsSizeMB = bytes / (1024 * 1024); // convert to MB
    }

    // ===============================
    // 4️⃣ Combine all dashboard data
    // ===============================
    const dashboardData = {
      totalCompanies: companies.length,
      totalAdmins: admins.length,
      totalStaff: staff.length,
      totalRevenue,
      totalActivePlan,
      activeCompanies,
      suspendedCompanies,
      pendingVerifications: pendingVerifications.length,
      recentCompanies,
      storage: {
        mongoDataSizeMB: mongoDataSizeMB.toFixed(2),
        mongoStorageUsedMB: mongoStorageUsedMB.toFixed(2),
        uploadsSizeMB: uploadsSizeMB.toFixed(2),
        totalCombinedMB: (mongoDataSizeMB + uploadsSizeMB).toFixed(2),
      },
    };

    return res.status(200).json({
      message: "✅ SuperAdmin dashboard data fetched successfully",
      data: dashboardData,
    });
  } catch (error) {
    console.error("❌ Error fetching SuperAdmin dashboard data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export default createSuperAdmin;
