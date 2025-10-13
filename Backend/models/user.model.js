import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  companyId: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    // select: false,
  },
  role: {
    type: String,
    enum: ['superAdmin', 'admin', 'staff', 'user'],
    default: 'user',
  },
  subRole: {
    type: String,
  },
  department: {
    type: String,
  },
  permissions: {
    approveRequests: { type: Boolean, default: false },
    assignTasks: { type: Boolean, default: false },
    manageAppointments: { type: Boolean, default: false },
    createInventory: { type: Boolean, default: false },
    updateInventory: { type: Boolean, default: false },
    viewInventory: { type: Boolean, default: false },
    deleteInventory: { type: Boolean, default: false },
    managePlans: { type: Boolean, default: false },
    manageTeams: { type: Boolean, default: false },
    createVendors: { type: Boolean, default: false },
    updateVendors: { type: Boolean, default: false },
    deleteVendors: { type: Boolean, default: false },
    viewVendors: { type: Boolean, default: false },
    staffCreate: { type: Boolean, default: false },
    staffDelete: { type: Boolean, default: false },
    staffUpdate: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    viewallstaff: { type: Boolean, default: false },
    editBilling: { type: Boolean, default: false },
    deleteBilling: { type: Boolean, default: false },
    addBilling: { type: Boolean, default: false },
    viewBilling: { type: Boolean, default: false },
    createPayment: { type: Boolean, default: false },
    viewAllStaffSalaries: { type: Boolean, default: false },
    updateSalary: { type: Boolean, default: false },
    deletePayment: { type: Boolean, default: false },
    staffSummary: { type: Boolean, default: false },
    viewActiveLog: { type: Boolean, default: false },
    viewCompanySummary: { type: Boolean, default: false },
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  // models/user.model.js  (add these fields)
  baseSalaryMonthly: { type: Number, default: 0, min: 0 },
  lastPaymentDate: { type: Date },

  verified: {
    type: Boolean,
    default: false,
  },
  verificationOTP: {
    type: String,
  },
  verificationExpiry: {
    type: Number,
  },
  status: {
    isaccepted: {
      type: String,
      enum: ['true', 'false', 'pending'],
      default: 'pending',
    },
    performedBy: {
      type: String,
    },
    updatedAt: {
      type: Date,
    },
  },
  history: [
    {
      action: {
        type: String,
        required: true,
      },
      performedBy: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  deleted: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Number,
  },
  lastLogin: {
    type: Date,
  },
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaSecret: {
    type: String,
    select: false,
  },
  twoFactorAuth: {
    isEnabled: { type: Boolean, default: false },
    secret: { type: String, select: false },
    backupCodes: [
      {
        code: { type: String, select: false },
        used: { type: Boolean, default: false },
        usedAt: { type: Date },
      },
    ],
  },
  addressBookId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('User', userSchema);
