import jwt from "jsonwebtoken";
import IndexModel from "../models/indexModel.js";
import { generateUniqueUserId } from "../utils/generateUniqueUserId.js";
import { generateOTP } from "../utils/generate_verifyOTP.js";
import sendEmail from "../utils/sendEmail.js";

const createStaff = async (req, res) => {
  try {
    const logginUser = req.user;

    const {
      name,
      email,
      password,
      subRole,
      department,
      permissions = [],
      phone,
      address,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await IndexModel.User.findOne({ email });
    if (
      existingUser ||
      existingUser?.deleted === true ||
      existingUser?.isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email already exists or was deleted in the past. Try a new email or update the status.",
      });
    }

    const newEmployee = new IndexModel.User({
      name,
      userId: await generateUniqueUserId(name),
      companyId: logginUser.companyId,
      email,
      password,
      role: "staff",
      subRole,
      department,
      permissions,
      phone,
      address,
      verified: true,
      status: {
        isaccepted: "true",
        performedBy: logginUser.userId,
        updatedAt: Date.now(),
      },
      history: [
        {
          action: "Employee created",
          performedBy: logginUser.userId,
        },
      ],
    });

    try {
      await newEmployee.save();

      const company = await IndexModel.Company.findOneAndUpdate(
        { companyId: logginUser.companyId },
        {
          $addToSet: { "gain.staff": newEmployee.userId },
          $push: {
            history: {
              action: `Employee ${newEmployee.userId} added to staff`,
              performedBy: logginUser.userId,
            },
          },
          updatedAt: Date.now(),
        },
        { new: true }
      );

      if (!company) {
        await IndexModel.User.deleteOne({ _id: newEmployee._id });
        return res.status(404).json({
          success: false,
          message: "Company not found. Employee creation rolled back.",
        });
      }



      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: {
          id: newEmployee._id,
          userId: newEmployee.userId,
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          companyId: newEmployee.companyId,
        },
      });
    } catch (error) {
      if (newEmployee._id) {
        await IndexModel.User.deleteOne({ _id: newEmployee._id });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating employee:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating employee",
      error: error.message,
    });
  }
};

const getAllStaff = async (req, res) => {
  // console.log("the req.user in the staff is:", req.user);

  try {
    const { companyId } = req.user;

    const staff = await IndexModel.User.find({
      companyId,
      role: "staff",
      deleted: false,
      isActive: true,
    }).lean();

    if (!staff || staff.length === 0) {
      console.warn(`No staff found on this company ${companyId}`);
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching staff",
      error: error.message,
    });
  }
};

const updateStaff = async (req, res) => {
  const { id } = req.params; // Staff ID from URL
  const {
    name,
    email,
    password,
    role,
    subRole,
    department,
    permissions,
    phone,
    address,
  } = req.body;

  // Find staff by ID
  const staff = await IndexModel.User.findById(id);
  if (!staff) {
    res.status(404);
    throw new Error('Staff member not found');
  }

  // Update fields (only those provided in the request)
  staff.name = name || staff.name;
  staff.email = email || staff.email;
  staff.role = role || staff.role;
  staff.subRole = subRole || staff.subRole;
  staff.department = department || staff.department;
  staff.permissions = permissions || staff.permissions;
  staff.phone = phone || staff.phone;
  staff.address = address || staff.address;
  staff.password = password || staff.password;

  // Save updated staff
  const updatedStaff = await staff.save();

  // Respond with updated staff details (excluding password)
  res.status(200).json({
    success: true,
    data: {
      _id: updatedStaff._id,
      name: updatedStaff.name,
      email: updatedStaff.email,
      role: updatedStaff.role,
      subRole: updatedStaff.subRole,
      department: updatedStaff.department,
      permissions: updatedStaff.permissions,
      phone: updatedStaff.phone,
      address: updatedStaff.address,
      password: updatedStaff.password,
    },
  });
}

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
    if (
      existingUser ||
      existingUser?.deleted === true ||
      existingUser?.isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email already exists or was deleted in the past. Try a new email or update the status.",
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
    console.error("Error registering user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while registering user",
      error: error.message,
    });
  }
};

const getAllAdminUsers = async (req, res) => {
  try {
    // Only superAdmin can access
    if (req.user.role !== 'superAdmin') {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: you can't access this",
      });
    }

    // Get all verified, not-deleted users
    const users = await IndexModel.User.find({
      deleted: false,
      verified: true,
      role: "admin", // exclude superAdmin users
    }).lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found',
      });
    }

    // For each user, fetch their company plan
    const data = await Promise.all(
      users.map(async (user) => {
        const company = await IndexModel.Company.findOne({
          owner: user.userId,
          companyId: user.companyId,
          deleted: false,
        }).lean();
        // console.log('the data is: ', company);
        return {
          ...user,
          plan: company ? company.plan : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching users',
      details: error.message,
    });
  }
};

const getAllCustomerUsers = async (req, res) => {
  try {
    // Only superAdmin can access
    if (req.user.role !== 'superAdmin') {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: you can't access this",
      });
    }

    // Get all verified, not-deleted users
    const users = await IndexModel.User.find({
      deleted: false,
      verified: true,
      role: "user" // exclude superAdmin users
    }).lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found',
      });
    }


    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching users',
      details: error.message,
    });
  }
};

const getUserAllById = async (req, res) => {
  try {
    const { id } = req.params;
    let user = await IndexModel.User.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'user not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching user',
      details: error.message,
    });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    let user = await IndexModel.User.findOneAndUpdate(
      { _id: id, companyId, deleted: false },   // only update if not already deleted
      { $set: { deleted: true } },   // mark as deleted
      { new: true }                  // return updated document
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found or already deleted',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while deleting user',
      details: error.message,
    });
  }
};

const active_inactiveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
console.log("The id and userId are:", id);
    let user = await IndexModel.User.findOne({
      _id: id,
      deleted: false,
    });

    // Toggle status
    const newStatus = !user.isActive;
    user.isActive = newStatus;

    // Add to history
    user.history.push({
      action: `Set isActive to ${newStatus}`,
      performedBy: userId || 'system',
      createdAt: new Date(),
    });

    await user.save();

    return res.status(200).json({
      message: `user ${
        newStatus ? 'activated' : 'deactivated'
      } successfully`,
      user,
    });
  } catch (error) {
    console.error('Error toggling user active state:', error);
    return res.status(500).json({
      message: 'Failed to update user status',
      error: error.message,
    });
  }
};

export default {
  createStaff,
  registerUser,
  getAllStaff,
  updateStaff,
  getUserAllById,
  getAllAdminUsers,
  getAllCustomerUsers,
  deleteStaff,
  active_inactiveUser,
};
