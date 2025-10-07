import mongoose from 'mongoose';

/**
 * Staff Salary Schema (with embedded history)
 * --------------------------------------------
 * Keeps a detailed record of each salary action (salary, bonus, decrement)
 * and an embedded mini-history for audit and UI display.
 */

const historySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['salary', 'bonus', 'decrement', 'adjustment'],
      required: true,
    },
    amount: { type: Number, required: true },
    totalPaid: { type: Number, required: true },
    performedBy: { type: String },
    remarks: { type: String },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const staffSalarySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Base monthly salary at payment time
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment type
    paymentType: {
      type: String,
      enum: ['salary', 'bonus', 'decrement'],
      required: true,
    },

    // Bonus / Decrement fields
    bonusAmount: { type: Number, default: 0, min: 0 },
    decrementAmount: { type: Number, default: 0, min: 0 },

    // Computed total
    totalPaid: { type: Number, required: true, min: 0 },

    // Payroll cycle (e.g., 2025-10)
    cycleMonth: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
      index: true,
    },

    processedBy: { type: String },
    processedAt: { type: Date, default: Date.now },

    // Optional remarks
    notes: { type: String, trim: true },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'paid',
      index: true,
    },

    // Salary payment history for audit
    history: [historySchema],

    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Automatically compute totalPaid if not provided
staffSalarySchema.pre('validate', function (next) {
  if (!this.totalPaid || this.totalPaid === 0) {
    if (this.paymentType === 'salary') this.totalPaid = this.baseSalary;
    else if (this.paymentType === 'bonus')
      this.totalPaid = this.baseSalary + this.bonusAmount;
    else if (this.paymentType === 'decrement')
      this.totalPaid = Math.max(0, this.baseSalary - this.decrementAmount);
  }
  next();
});

// Automatically push a record into history when saving
staffSalarySchema.pre('save', function (next) {
  const actionData = {
    action: this.paymentType,
    amount:
      this.paymentType === 'salary'
        ? this.baseSalary
        : this.paymentType === 'bonus'
        ? this.bonusAmount
        : this.decrementAmount,
    totalPaid: this.totalPaid,
    performedBy: this.processedBy,
    remarks: this.notes || '',
    date: new Date(),
  };
  this.history.push(actionData);
  next();
});

const StaffSalary = mongoose.model('StaffSalary', staffSalarySchema);
export default StaffSalary;
