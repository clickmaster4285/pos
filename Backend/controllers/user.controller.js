import jwt from 'jsonwebtoken';
import IndexModel from '../models/indexModel.js';
import { generateUniqueUserId } from '../utils/generateUniqueUserId.js';
import { generateOTP } from '../utils/generate_verifyOTP.js';
import sendEmail from '../utils/sendEmail.js';
import ZKDeviceService from "../utils/zkDeviceService.js";
import bcrypt from 'bcrypt';
import { getDefaultPermissions } from '../utils/UserPermissionsCatelogs.js';

const createStaff = async (req, res) => {
  try {
    const { logginUser , userId: performerId,  companyId } = req.user;
    const { name, email, password, subRole, department, permissions = {}, phone, address, baseSalaryMonthly, lastPaymentDate, deviceIds = [], } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    }

    const existingUser = await IndexModel.User.findOne({ email, deleted: false });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const userId = await generateUniqueUserId(name);
    let zkUserId = null;
    const syncedDevices = [];

    // Create user on all selected ZK devices
    try {
      if (deviceIds.length > 0) {
        zkUserId = userId;

        for (const deviceId of deviceIds) {
          console.log("the device id in the user creation is", deviceId);
          const device = await IndexModel.AttendanceDevice.findById(deviceId);
          if (!device) {
            throw new Error(`Device ${deviceId} not found`);
          }
          await ZKDeviceService.createZKUser({ name, userId, zkUserId, deviceId, role: subRole, companyId: req.user.companyId });
          syncedDevices.push(deviceId);
        }
      }
    } catch (zkError) {
      console.error('Error creating user on ZK device(s):', zkError);
      // Rollback: Delete user from any devices where they were created
      for (const deviceId of syncedDevices) {
        await ZKDeviceService.deleteZKUser(zkUserId, deviceId);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create user on one or more ZK devices',
        error: zkError.message,
      });
    }

    let staffPermissions = permissions;
    if (!permissions || Object.keys(permissions).length === 0) {
      staffPermissions = await getDefaultPermissions('staff', companyId);
    }

    const newEmployee = new IndexModel.User({
      name,
      userId,
      companyId,
      // companyId: logginUser.companyId,
      email,
      password,
      role: 'staff',
      subRole,
      department,
      permissions: staffPermissions,
      phone,
      address,
      baseSalaryMonthly,
      lastPaymentDate,
      zkUserId,
      deviceIds,
      verified: true,
      status: {
        isaccepted: 'true',
        performedBy: performerId,
        updatedAt: Date.now(),
      },
      history: [
        {
          action: 'Employee created',
          performedBy: performerId,
        },
      ],
    });

    try {
      await newEmployee.save();

      const company = await IndexModel.Company.findOneAndUpdate(
        { companyId },
        {
          $addToSet: { 'gain.staff': newEmployee.userId },
          $push: {
            history: {
              action: `Employee ${newEmployee.userId} added to staff`,
              performedBy: performerId,
            },
          },
          updatedAt: Date.now(),
        },
        { new: true }
      );

      if (!company) {
        // Rollback: Delete user from database and all ZK devices
        await IndexModel.User.deleteOne({ _id: newEmployee._id });
        for (const deviceId of syncedDevices) {
          await ZKDeviceService.deleteZKUser(zkUserId, deviceId);
        }
        return res.status(404).json({
          success: false,
          message: 'Company not found. Employee creation rolled back.',
        });
      }

      // Initialize fingerprint enrollment for the user on all devices
      // try {
      //   for (const deviceId of deviceIds) {
      //     await ZKDeviceService.initializeFingerprint(deviceId, userId);
      //   }
      // } catch (fpError) {
      //   console.error('Error initializing fingerprint:', fpError);
      //   // Optional: Decide whether to rollback or continue based on requirements
      //   // For now, we'll continue and log the error
      // }

      return res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: {
          id: newEmployee._id,
          userId: newEmployee.userId,
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          baseSalaryMonthly: newEmployee.baseSalaryMonthly,
          lastPaymentDate: newEmployee.lastPaymentDate,
          companyId: newEmployee.companyId,
          zkUserId: newEmployee.zkUserId,
          deviceIds: newEmployee.deviceIds,
        },
      });
    } catch (error) {
      // Rollback: Delete user from database and all ZK devices
      if (newEmployee._id) {
        await IndexModel.User.deleteOne({ _id: newEmployee._id });
      }
      for (const deviceId of syncedDevices) {
        await ZKDeviceService.deleteZKUser(zkUserId, deviceId);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating employee',
      error: error.message,
    });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const { companyId } = req.user;

    const staff = await IndexModel.User.find({
      companyId,
      role: 'staff',
      deleted: false,
      isActive: true,
    }).lean();

    if (!staff || staff.length === 0) {
      console.info(`No staff found on this company ${companyId}`);
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
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
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
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
          'Email already exists or was deleted in the past. Try a new email or update the status.',
      });
    }

    const userId = await generateUniqueUserId(name);

    const user = new IndexModel.User({
      name,
      userId,
      email,
      password,
      role: 'user',
      phone,
      address,
      verified: false,
      status: {
        isaccepted: 'true',
        performedBy: userId,
        updatedAt: Date.now(),
      },
      history: [
        {
          action: 'Customer registered',
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
          subject: 'Verify Your Account',
          template: 'emailVerification',
          data: { name: user.name, otp },
        });
      } catch (emailError) {
        await IndexModel.User.findByIdAndDelete(user._id);
        return res.status(500).json({
          success: false,
          message:
            'Failed to send verification email, user creation rolled back',
          error: emailError.message,
        });
      }

      return res.status(201).json({
        success: true,
        message:
          'User registered successfully. Please verify via the OTP sent to your email within 1 minute.',
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
        message: 'Failed to create user, creation rolled back',
        error: saveError.message,
      });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while registering user',
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
      role: 'admin', // exclude superAdmin users
    }).lean();

    if (!users || users.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'company Admin not found',
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
          company_id: company._id || company.id,
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
      role: 'user', // exclude superAdmin users
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
      { _id: id, companyId, deleted: false }, // only update if not already deleted
      { $set: { deleted: true } }, // mark as deleted
      { new: true } // return updated document
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
    console.log('The id and userId are:', id);
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
      message: `user ${newStatus ? 'activated' : 'deactivated'} successfully`,
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

//--------------helper--------------------
const send = (res, code, payload) => res.status(code).json(payload);

/*    EMAIL CHANGE – INITIATE */
export const initiateEmailChange = async (req, res) => {
  try {
    const { currentEmail, newEmail, userId } = req.body || {};
    const targetId = userId || req.user?.id || req.user?._id;

    if (!targetId || !currentEmail || !newEmail) {
      return res.status(400).json({ success: false, message: 'currentEmail, newEmail, and userId/req.user are required' });
    }

    const user = await IndexModel.User.findById(targetId);
    if (!user || user.deleted || user.isActive === false) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email.trim().toLowerCase() !== currentEmail.trim().toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Current email does not match' });
    }

    const exists = await IndexModel.User.findOne({
      email: newEmail.trim().toLowerCase(),
      deleted: false,
      isActive: true,
      _id: { $ne: user._id },
    }).lean();
    if (exists) {
      return res.status(409).json({ success: false, message: 'New email already exists' });
    }

    const { otp, hashedOTP } = await generateOTP();

    user.security = user.security || {};
    user.security.emailChange = {
      newEmail: newEmail.trim().toLowerCase(),
      codeHash: hashedOTP,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      createdAt: new Date(),
    };

    user.markModified('security');   // <-- ensure persistence
    await user.save();

    try {
      await sendEmail({
        email: user.email,                 // send to current email
        subject: 'Email Change Verification',
        template: 'emailVerification',
        data: { name: user.name, otp },
      });
    } catch (e) {
      // rollback pending
      user.security.emailChange = undefined;
      user.markModified('security');
      await user.save();
      return res.status(500).json({ success: false, message: 'Failed to send verification email', error: e.message });
    }

    return res.status(200).json({ success: true, message: 'OTP sent to current email.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

/*    EMAIL CHANGE – VERIFY */
export const verifyEmailChange = async (req, res) => {
  try {
    const { code, userId } = req.body || {};
    const targetId = userId || req.user?.id || req.user?._id;
    if (!targetId || !code)
      return res
        .status(400)
        .json({ success: false, message: 'code and userId/req.user required' });

    const user = await IndexModel.User.findById(targetId);
    if (!user?.security?.emailChange) {
      return res
        .status(400)
        .json({ success: false, message: 'No pending email change' });
    }

    const pending = user.security.emailChange;
    if (Date.now() > pending.expiresAt) {
      user.security.emailChange = undefined;
      user.markModified('security');
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const ok = await bcrypt.compare(String(code), pending.codeHash || '');
    if (!ok) {
      user.security.emailChange.attempts = (pending.attempts || 0) + 1;
      user.markModified('security');
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid code' });
    }

    const oldEmail = user.email;
    user.email = pending.newEmail;
    user.security.emailChange = undefined;

    // history (matches your schema: action, performedBy, createdAt auto)
    user.history = user.history || [];
    user.history.push({
      action: 'EMAIL_UPDATED',
      performedBy: String(targetId),
    });

    user.markModified('security');
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      data: { id: user._id, email: user.email },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: err.message });
  }
};

/*    PASSWORD CHANGE – INITIATE */
export const initiatePasswordChange = async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body || {};
    const targetId = userId || req.user?.id || req.user?._id;

    if (!targetId || !currentPassword || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            'currentPassword, newPassword, and userId/req.user are required',
        });
    }
    if (String(newPassword).length < 8) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'newPassword must be at least 8 characters',
        });
    }

    const user = await IndexModel.User.findById(targetId).select('+password');
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password || '');
    if (!match)
      return res
        .status(400)
        .json({ success: false, message: 'Current password incorrect' });

    const { otp, hashedOTP } = await generateOTP();
    const newPassHash = await bcrypt.hash(newPassword, 10);

    user.security = user.security || {};
    user.security.passwordChange = {
      codeHash: hashedOTP,
      newPassHash,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      createdAt: new Date(),
    };

    user.markModified('security');
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Change Verification',
        template: 'emailVerification',
        data: { name: user.name, otp },
      });
    } catch (e) {
      user.security.passwordChange = undefined;
      user.markModified('security');
      await user.save();
      return res
        .status(500)
        .json({
          success: false,
          message: 'Failed to send verification email',
          error: e.message,
        });
    }

    return res
      .status(200)
      .json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: err.message });
  }
};

/*    PASSWORD CHANGE – VERIFY */
export const verifyPasswordChange = async (req, res) => {
  try {
    const { code, userId } = req.body || {};
    const targetId = userId || req.user?.id || req.user?._id;
    if (!targetId || !code)
      return res
        .status(400)
        .json({ success: false, message: 'code and userId/req.user required' });

    const user = await IndexModel.User.findById(targetId).lean();
    if (!user?.security?.passwordChange) {
      return res
        .status(400)
        .json({ success: false, message: 'No pending password change' });
    }

    const pending = user.security.passwordChange;
    if (Date.now() > new Date(pending.expiresAt).getTime()) {
      await IndexModel.User.updateOne(
        { _id: targetId },
        { $unset: { 'security.passwordChange': 1 } }
      );
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const ok = await bcrypt.compare(String(code), pending.codeHash || '');
    if (!ok) {
      await IndexModel.User.updateOne(
        { _id: targetId },
        { $inc: { 'security.passwordChange.attempts': 1 } }
      );
      return res.status(400).json({ success: false, message: 'Invalid code' });
    }

    // Atomic commit: set password to stored hash, unset pending, push history
    await IndexModel.User.updateOne(
      { _id: targetId },
      {
        $set: { password: pending.newPassHash, passwordChangedAt: new Date() },
        $unset: { 'security.passwordChange': 1 },
        $push: {
          history: {
            action: 'PASSWORD_UPDATED',
            performedBy: String(targetId),
            // createdAt auto by schema default
          },
        },
      }
    );

    return res
      .status(200)
      .json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: err.message });
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
  //
  initiateEmailChange,
  verifyEmailChange,
  initiatePasswordChange,
  verifyPasswordChange,
};
