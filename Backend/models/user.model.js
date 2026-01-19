import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const EmailChangeSchema = new mongoose.Schema({
  newEmail: { type: String, lowercase: true, trim: true },
  codeHash: String,
  expiresAt: Date,
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const PasswordChangeSchema = new mongoose.Schema({
  codeHash: String,
  newPassHash: String,
  expiresAt: Date,
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const SecuritySchema = new mongoose.Schema({
  emailChange: EmailChangeSchema,
  passwordChange: PasswordChangeSchema
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  companyId: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superAdmin', 'admin', 'staff', 'user'], default: 'user' },
  subRole: String,
  department: String,
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  phone: String,
  address: String,
  baseSalaryMonthly: { type: Number, default: 0, min: 0 },
  lastPaymentDate: Date,
  verified: { type: Boolean, default: false },
  verificationOTP: String,
  verificationExpiry: Number,
  status: {
    isaccepted: { type: String, enum: ['true', 'false', 'pending'], default: 'pending' },
    performedBy: String,
    updatedAt: Date
  },
  history: [{
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  deleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Number,
  lastLogin: Date,
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, select: false },
  twoFactorAuth: {
    isEnabled: { type: Boolean, default: false },
    secret: { type: String, select: false },
    backupCodes: [{
      code: { type: String, select: false },
      used: { type: Boolean, default: false },
      usedAt: Date
    }]
  },
  security: { type: SecuritySchema, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();

  if (this.isModified('password') && !this.password.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isNew && Object.keys(this.permissions).length === 0) {
    this.permissions = await this.initializePermissions();
  }

  next();
});

userSchema.methods.initializePermissions = async function () {
  const { getDefaultPermissions } = await import('../utils/permissions.js');
  return getDefaultPermissions(this.role, this.companyId);
};

userSchema.methods.hasPermission = function (permissionName) {
  if (this.role === 'superAdmin') return true;

  const normalizedPermission = permissionName.toLowerCase();
  const permissionKey = Object.keys(this.permissions || {}).find(
    key => key.toLowerCase() === normalizedPermission
  );

  return permissionKey ? this.permissions[permissionKey] === true : false;
};

userSchema.statics.getPermissionKeys =async function () {
  const { getAllPermissions } = await import('../utils/permissions.js');
  return getAllPermissions();
};

export default mongoose.model('User', userSchema);