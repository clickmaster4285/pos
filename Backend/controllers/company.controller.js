import IndexModel from "../models/indexModel.js";
import { generateUniqueUserId } from "../utils/generateUniqueUserId.js";
import { generateUniqueCompanyId } from "../utils/generateUniqueCompanyId.js";
import sendEmail from "../utils/sendEmail.js";
import { generateOTP } from "../utils/generate_verifyOTP.js";
import bcrypt from "bcrypt";
import { upload } from "../config/multer.js";
import path from "path";
import { generatePlanId } from "../utils/generatePlanIdPurchased.js";

const createCompany = async (req, res) => {
  try {
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

    const userId = await generateUniqueUserId(admin.name);
    // Create company
    const newCompany = new IndexModel.Company({
      name: company.name,
      companyId,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      address: company.address,
      industryName: company.industryName,
      plan: {
        planId: await generatePlanId(companyId, userId),
        status: "not started",
        ...availablePlan,
        isActive: availablePlan.price === 0,
      },
      history: [
        {
          action: "Company created",
          performedBy: userId,
        },
      ],
      isActive: false,
    });
    // Create admin user
    const adminUser = new IndexModel.User({
      name: admin.name,
      email: admin.email,
      password: admin.password,
      role: "admin",
      companyId: newCompany.companyId,
      userId,
      address: admin.address,
      Phone: admin.phone,
      status: {
        isaccepted: availablePlan.price === 0 ? "true" : "pending",
        performedBy: availablePlan.price === 0 ? "free plan" : "",
        updatedAt: new Date(),
      },
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
          action: "Admin created",
          performedBy: userId,
        },
      ],
      verified: false,
    });

    // Set company owner to admin user's userId
    newCompany.owner = adminUser.userId;

    // Save company first
    await newCompany.save();

    // Generate OTP
    const { otp, hashedOTP } = await generateOTP();
    adminUser.verificationOTP = hashedOTP;
    adminUser.verificationExpiry = Date.now() + 60 * 1000; // 1 minute

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

    // Send verification email
    try {
      await sendEmail({
        email: admin.email,
        subject: "Verify Your Account",
        template: "emailVerification",
        data: { name: admin.name, otp },
      });
    } catch (emailError) {
      await IndexModel.Company.findByIdAndDelete(newCompany._id);
      await IndexModel.User.findByIdAndDelete(adminUser._id);
      return res.status(500).json({
        success: false,
        error: "Failed to send verification email, creation rolled back",
        details: emailError.message,
      });
    }

    // Verify both company and admin exist
    const verifyCompany = await IndexModel.Company.findById(newCompany._id);
    const verifyAdmin = await IndexModel.User.findById(adminUser._id);

    if (!verifyCompany || !verifyAdmin) {
      // Clean up if either doesn't exist
      if (verifyCompany)
        await IndexModel.Company.findByIdAndDelete(newCompany._id);
      if (verifyAdmin) await IndexModel.User.findByIdAndDelete(adminUser._id);

      return res.status(400).json({
        success: false,
        error: "Verification failed: Incomplete creation detected, rolled back",
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

const verifyCompany_Admin = async (req, res) => {
  const { id, action } = req.query;
  try {
    if (req.user.role !== "superAdmin") {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Only superAdmin can perform this action",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action: Must be "approve" or "reject"',
      });
    }

    const performedBy = req.user?.userId;
    const isActive = action === "approve" ? "true" : "false";
    const actionMessage =
      action === "approve"
        ? "Company admin approved"
        : "Company admin rejected";

    const company = await IndexModel.Company.findByIdAndUpdate(
      { _id: id, deleted: false, isActive: false },
      {
        $set: {
          isActive: action === "approve",
        },
        $push: {
          history: {
            action: actionMessage,
            performedBy,
            performedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );
    // Update user to set status.isaccepted and status.isactive
    const updatedUser = await IndexModel.User.findOneAndUpdate(
      {
        userId: company.owner,
        deleted: false,
        isActive: false,
        verified: true,
      },
      {
        $set: {
          "status.isaccepted": isActive,
          "status.performedBy": performedBy,
          "status.updatedAt": new Date(),
          isActive: true,
        },
        $push: {
          history: {
            action: actionMessage,
            performedBy,
            performedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Company admin ${
        action === "approve" ? "approved" : "rejected"
      } successfully`,
      data: {
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error(`Error ${action} company admin:`, error);
    return res.status(500).json({
      success: false,
      error: `Server error during ${action} verification`,
      details: error.message,
    });
  }
};

const updateCompanySettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    let updateData = req.body;

    // Parse stringified JSON if needed
    if (updateData.settings && typeof updateData.settings === "string") {
      try {
        updateData = JSON.parse(updateData.settings);
      } catch (err) {
        return res.status(400).json({ error: "Invalid settings JSON" });
      }
    }

    // Validate input
    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const validNumbering = ["sequential", "yearly"];
    if (
      updateData.invoiceSettings?.format?.numbering &&
      !validNumbering.includes(updateData.invoiceSettings.format.numbering)
    ) {
      return res.status(400).json({ error: "Invalid numbering format" });
    }

    if (
      updateData.invoiceSettings?.tax?.taxRateCash &&
      (updateData.invoiceSettings.tax.taxRateCash < 0 ||
        updateData.invoiceSettings.tax.taxRateCash > 100)
    ) {
      return res
        .status(400)
        .json({ error: "Tax rate (cash) must be between 0 and 100" });
    }

    if (
      updateData.invoiceSettings?.tax?.taxRateCard &&
      (updateData.invoiceSettings.tax.taxRateCard < 0 ||
        updateData.invoiceSettings.tax.taxRateCard > 100)
    ) {
      return res
        .status(400)
        .json({ error: "Tax rate (card) must be between 0 and 100" });
    }

    // Validate contactPhone (basic phone number format)
    if (updateData.companySettings?.contactPhone) {
      const phoneRegex = /^\+?[\d\s-]{7,15}$/;
      if (!phoneRegex.test(updateData.companySettings.contactPhone)) {
        return res.status(400).json({ error: "Invalid contact phone format" });
      }
    }

    // Validate address (basic check for non-empty string)
    if (
      updateData.companySettings?.address &&
      typeof updateData.companySettings.address !== "string"
    ) {
      return res.status(400).json({ error: "Address must be a valid string" });
    }

    // Handle logo (optional upload)
    let logoUrl = updateData.companySettings?.logoPreview || "";
    if (req.file) {
      logoUrl = `/Uploads/company/${req.file.filename}`;
    }

    // Update company
    const updatedCompany = await IndexModel.Company.findOneAndUpdate(
      { companyId, deleted: false, isActive: true },
      {
        $set: {
          invoiceSettings: updateData.invoiceSettings || {},
          name: updateData.companySettings.companyName,
          contactPhone: updateData.companySettings.contactPhone || "",
          address: updateData.companySettings.address || "",
          companyLogo: logoUrl,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      companySettings: {
        companyName: updatedCompany.name,
        contactPhone: updatedCompany.contactPhone,
        address: updatedCompany.address,
        companyLogo: updatedCompany.companyLogo,
      },
      invoiceSettings: updatedCompany.invoiceSettings,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get company by ID
const getCompany = async (req, res) => {
  try {
    const { id } = req.query;
    let company;
    if (req.user.role === "superAdmin") {
      company = await IndexModel.Company.findOne({ _id: id });
    }

    company = await IndexModel.Company.findOne({
      companyId: req.user.companyId,
      deleted: false,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error while fetching company",
      details: error.message,
    });
  }
};

// Get all company
const getAllCompany = async (req, res) => {
  try {
    // Only allow superAdmin access
    if (req.user.role !== "superAdmin") {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: you cannot access it",
      });
    }

    // Fetch all companies
    const companies = await IndexModel.Company.find();

    if (!companies || companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No companies found",
      });
    }

    // Map each company to include its admin (owner) details
    const companiesWithOwner = await Promise.all(
      companies.map(async (company) => {
        const owner = await IndexModel.User.findOne(
          { userId: company.owner },
        );

        console.log("the company is :", owner);
        return {
          ...company.toObject(),
          ownerDetails: owner || null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: companiesWithOwner.length,
      data: companiesWithOwner,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while fetching companies",
      details: error.message,
    });
  }
};

const active_inactiveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // 1. Find company
    let company = await IndexModel.Company.findOne({
      _id: id,
      deleted: false,
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // 2. Toggle status
    const newStatus = !company.isActive;
    company.isActive = newStatus;

    // 3. Add to history
    company.history.push({
      action: `Set isActive to ${newStatus}`,
      performedBy: userId || "system",
      createdAt: new Date(),
    });

    // 4. Save company
    await company.save();

    // 5. Update all users of the company
    await IndexModel.User.updateMany(
      { companyId: company.companyId, deleted: false },
      { $set: { isActive: newStatus } }
    );

    return res.status(200).json({
      message: `Company ${
        newStatus ? "activated" : "deactivated"
      } successfully, and all users updated.`,
      company,
    });
  } catch (error) {
    console.error("Error toggling company active state:", error);
    return res.status(500).json({
      message: "Failed to update company status",
      error: error.message,
    });
  }
};
const send = (res, code, payload) => res.status(code).json(payload);

//------------company email change
export const initiateCompanyEmailChange = async (req, res) => {
  try {
    const { currentEmail, newEmail } = req.body || {};

    // Basic validation
    if (!currentEmail || !newEmail) {
      return res.status(400).json({
        success: false,
        message: "Both currentEmail and newEmail are required",
      });
    }

    const curr = currentEmail.trim().toLowerCase();
    const next = newEmail.trim().toLowerCase();

    // Find company by current email
    const company = await IndexModel.Company.findOne({
      contactEmail: curr,
      deleted: false,
      isActive: true,
    });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found with that email" });
    }

    // Check if same email
    if (curr === next) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from current email",
      });
    }

    // Check for duplicate email in other companies
    const exists = await IndexModel.Company.findOne({
      contactEmail: next,
      deleted: false,
      isActive: true,
      _id: { $ne: company._id },
    }).lean();

    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: "New email already exists" });
    }

    // Generate OTP
    const { otp, hashedOTP } = await generateOTP();

    company.security = company.security || {};
    company.security.emailChange = {
      newEmail: next,
      codeHash: hashedOTP,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      createdAt: new Date(),
    };

    company.markModified("security");
    await company.save();

    // Send verification email to current email
    try {
      await sendEmail({
        email: company.contactEmail,
        subject: "Company Email Change Verification",
        template: "emailVerification",
        data: { name: company.name || "there", otp },
      });
    } catch (e) {
      // Rollback pending email change on failure
      company.security.emailChange = undefined;
      company.markModified("security");
      await company.save();

      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
        error: e.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to current company email.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

//company verify email change
export const verifyCompanyEmailChange = async (req, res) => {
  try {
    const { code, currentEmail } = req.body || {};

    // Validate inputs
    if (!code || !currentEmail) {
      return res.status(400).json({
        success: false,
        message: "Both code and currentEmail are required",
      });
    }

    // Find company by current contactEmail
    const company = await IndexModel.Company.findOne({
      contactEmail: currentEmail.trim().toLowerCase(),
      deleted: false,
      isActive: true,
    });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found with that email" });
    }

    const pending = company?.security?.emailChange;
    if (!pending) {
      return res
        .status(400)
        .json({ success: false, message: "No pending email change" });
    }

    // Check expiry
    if (Date.now() > pending.expiresAt) {
      company.security.emailChange = undefined;
      company.markModified("security");
      await company.save();
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Compare OTP
    const ok = await bcrypt.compare(String(code), pending.codeHash || "");
    if (!ok) {
      company.security.emailChange.attempts = (pending.attempts || 0) + 1;
      company.markModified("security");
      await company.save();
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    // Success — update contactEmail
    const oldEmail = company.contactEmail;
    company.contactEmail = pending.newEmail;
    company.security.emailChange = undefined;

    // Log history
    company.history = company.history || [];
    company.history.push({
      action: "EMAIL_UPDATED",
      performedBy: "system",
      createdAt: new Date(),
    });

    company.markModified("security");
    await company.save();

    return res.status(200).json({
      success: true,
      message: "Company email updated successfully",
      data: {
        id: company._id,
        oldEmail,
        newEmail: company.contactEmail,
      },
    });
  } catch (err) {
    console.error("verifyCompanyEmailChange error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export default {
  createCompany,
  getCompany,
  verifyCompany_Admin,
  getAllCompany,
  active_inactiveCompany,
  updateCompanySettings,
  initiateCompanyEmailChange,
  verifyCompanyEmailChange,
};
