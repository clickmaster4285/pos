import IndexModel from '../models/indexModel.js';
import { generateUniqueUserId } from '../utils/generateUniqueUserId.js';
import { generateUniqueCompanyId } from '../utils/generateUniqueCompanyId.js';
import sendEmail from '../utils/sendEmail.js';
import { generateOTP } from '../utils/generate_verifyOTP.js';
import bcrypt from 'bcrypt';

const createCompany = async (req, res) => {
  try {
    const { company, admin } = req.body;

    // Validate required fields
    if (!company || !company.name || !company.contactEmail || !company.plan) {
      return res.status(400).json({
        success: false,
        error: 'Company name, contact email, and plan are required',
      });
    }

    if (!admin || !admin.name || !admin.email || !admin.password) {
      return res.status(400).json({
        success: false,
        error: 'Admin name, email, and password are required',
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
        error: 'plan does not exist or deactivated: contact support',
      });
    }
    if (company.plan !== availablePlan.id) {
      return res.status(400).json({
        success: false,
        error: 'plan does not exist or deactivated: contact support',
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
      plan: {
        ...availablePlan,
      },
      history: [
        {
          action: 'Company created',
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
      role: 'admin',
      companyId: newCompany.companyId,
      userId,
      address: admin.address,
      Phone: admin.phone,
      permissions: {
        staffCreate: true,
        staffUpdate: true,
        staffDelete: true,
        viewallstaff: true,
        viewReports: true,
        manageInventory: true,
        manageVendors: true,
        assignTasks: true,
        approveRequests: true,
        manageAppointments: true, // receptionist use
        manageTeams: true,
        managePlans: true, // for superadmin/admin
      },
      history: [
        {
          action: 'Admin created',
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
    adminUser.verificationExpiry = Date.now() + 1 * 60 * 1000; // 1 minute

    try {
      // Try to save admin
      await adminUser.save();
    } catch (adminError) {
      // If admin creation fails, delete the created company
      await IndexModel.Company.findByIdAndDelete(newCompany._id);
      return res.status(400).json({
        success: false,
        error: 'Failed to create admin, company creation rolled back',
        details: adminError.message,
      });
    }

    // Send verification email
    try {
      await sendEmail({
        email: admin.email,
        subject: 'Verify Your Account',
        template: 'emailVerification',
        data: { name: admin.name, otp },
      });
    } catch (emailError) {
      await IndexModel.Company.findByIdAndDelete(newCompany._id);
      await IndexModel.User.findByIdAndDelete(adminUser._id);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email, creation rolled back',
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
        error: 'Verification failed: Incomplete creation detected, rolled back',
      });
    }

    // Return response with populated data
    const populatedCompany = await IndexModel.Company.findById(newCompany._id)
      .populate('owner', 'name email userId')
      .populate('plan');

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
        'Company and admin created. Please verify via the OTP sent to your email within 1 minute.',
    });
  } catch (error) {
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Company name, company ID, or admin email already exists',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error while creating company and admin',
      details: error.message,
    });
  }
};

const verifyCompany_Admin = async (req, res) => {
  try {
    const { id } = req.query;
    // console.log("tje id: ", id)
    if (req.user.role !== 'superAdmin') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Only superAdmin can perform this action',
      });
    }
    const performedBy = req.user?.userId; // Assuming authenticated user ID is available in req.user

    // Update user to set status.isaccepted to "true" and add history entry
    const updatedUser = await IndexModel.User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          'status.isaccepted': 'true',
          'status.performedBy': performedBy,
          'status.updatedAt': new Date(),
          // "status.updatedAt": new Date(),
        },
        $push: {
          history: {
            action: 'Company admin verified',
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
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Company admin verified successfully',
      data: {
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('Error verifying company admin:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during verification',
      details: error.message,
    });
  }
};

// Get company by ID
const getCompany = async (req, res) => {
  try {
    const { id } = req.params;
    let company;
    if (req.user.role === 'superAdmin') {
      // console.log("eh id is : ", id)
      company = await IndexModel.Company.findOne({ _id: id });
    }
    company = await IndexModel.Company.findOne({
      owner: req.user.userId,
      _id: id,
      deleted: false,
      isActive: true,
      role: 'admin',
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching company',
      details: error.message,
    });
  }
};

// Get all company
const getAllCompany = async (req, res) => {
  try {
    if (req.user.role !== 'superAdmin') {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: you cann't access it",
      });
    }
    const company = await IndexModel.Company.find();

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching company',
      details: error.message,
    });
  }
};
const active_inactiveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId } = req.user;

    let company = await IndexModel.Company.findOne({
      _id: id,

      deleted: false,
    });

    // Toggle status
    const newStatus = !company.isActive;
    company.isActive = newStatus;

    // Add to history
    company.history.push({
      action: `Set isActive to ${newStatus}`,
      performedBy: userId || 'system',
      createdAt: new Date(),
    });

    await company.save();

    return res.status(200).json({
      message: `Company ${
        newStatus ? 'activated' : 'deactivated'
      } successfully`,
      company,
    });
  } catch (error) {
    console.error('Error toggling company active state:', error);
    return res.status(500).json({
      message: 'Failed to update company status',
      error: error.message,
    });
  }
};

export default {
  createCompany,
  getCompany,
  verifyCompany_Admin,
  getAllCompany,
  active_inactiveCompany,
};
