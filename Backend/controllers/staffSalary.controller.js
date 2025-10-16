import IndexModel from '../models/indexModel.js';

const yyyymm = (d = new Date()) => d.toISOString().slice(0, 7);
const safeNumber = (v, fallback = 0) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};
// prefer this order; falls back if you kept old fields
const getBaseMonthly = (user) =>
  safeNumber(
    user?.baseSalaryMonthly ?? user?.salaryMonthly ?? user?.salary ?? 0,
    0
  );

//to make payment
export const processPayment = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    const processedBy = req.user?.userId || 'system';

    const {
      staffId,
      paymentType = 'salary',
      paymentMethod = '', // incoming dropdown value OR custom text
      customMethod = '', // optional extra field when dropdown = "custom"
      bonusAmount = 0,
      decrementAmount = 0,
      notes = '',
      cycleMonth = yyyymm(),
    } = req.body;

    if (!companyId)
      return res
        .status(400)
        .json({ success: false, message: 'companyId required' });
    if (!staffId)
      return res
        .status(400)
        .json({ success: false, message: 'staffId required' });

    // normalize amounts
    const bonus = Math.max(0, Number(bonusAmount) || 0);
    const dec = Math.max(0, Number(decrementAmount) || 0);

    // payment type guard
    if (paymentType !== 'salary') {
      return res
        .status(400)
        .json({ success: false, message: 'paymentType must be "salary"' });
    }

    // only one of bonus/dec at a time
    if (bonus > 0 && dec > 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide either bonusAmount or decrementAmount, not both',
      });
    }

    // resolve & validate payment method
    const rawMethod = String(paymentMethod || '').trim();
    let finalMethod = rawMethod;

    // allow dropdown values or any non-empty custom text
    const ALLOWED = new Set(['cash', 'card', 'easypaisa']);
    if (rawMethod.toLowerCase() === 'custom') {
      const cm = String(customMethod || '').trim();
      if (!cm) {
        return res.status(400).json({
          success: false,
          message: 'customMethod is required when paymentMethod is "custom"',
        });
      }
      finalMethod = cm; // use provided custom value
    } else if (!rawMethod) {
      return res.status(400).json({
        success: false,
        message: 'paymentMethod is required',
      });
    } else if (!ALLOWED.has(rawMethod.toLowerCase())) {
      // treat any non-empty non-allowed value as custom free text
      finalMethod = rawMethod;
    }

    // fetch staff
    const staff = await IndexModel.User.findOne({
      _id: staffId,
      companyId,
      deleted: { $ne: true },
    });

    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: 'Staff not found' });

    const baseSalary = getBaseMonthly(staff);
    if (!Number.isFinite(baseSalary) || baseSalary <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Staff base monthly salary not set' });
    }

    // prevent duplicate salary in same month
    const exists = await IndexModel.StaffSalary.findOne({
      companyId,
      staffId,
      cycleMonth,
      paymentType: 'salary',
      deleted: { $ne: true },
    }).lean();

    if (exists) {
      return res.status(409).json({
        success: false,
        message: `Salary already processed for ${cycleMonth}`,
      });
    }

    // compute total
    const totalPaid = Math.max(0, baseSalary + bonus - dec);

    const doc = await IndexModel.StaffSalary.create({
      companyId,
      staffId,
      baseSalary,
      paymentType: 'salary',
      paymentMethod: finalMethod, // ✅ use resolved value (required)
      bonusAmount: bonus,
      decrementAmount: dec,
      totalPaid,
      cycleMonth,
      processedBy,
      notes,
      status: 'paid',
    });

    await IndexModel.User.updateOne(
      { _id: staffId, companyId, deleted: { $ne: true } },
      {
        $set: {
          lastPaymentDate: new Date(),
          lastSalaryPaidMonth: cycleMonth,
        },
      }
    );

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('processPayment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStaffBaseSalary = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    const updatedBy = req.user?.userId || 'system';
    const { staffId } = req.params;
    const { newSalary, reason = '' } = req.body;

    if (!companyId)
      return res
        .status(400)
        .json({ success: false, message: 'companyId required' });
    if (!staffId)
      return res
        .status(400)
        .json({ success: false, message: 'staffId required' });

    const salaryValue = Number(newSalary);
    if (!salaryValue || salaryValue <= 0)
      return res
        .status(400)
        .json({ success: false, message: 'newSalary must be greater than 0' });

    const staff = await IndexModel.User.findOne({
      _id: staffId,
      companyId,
      deleted: { $ne: true },
    });
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: 'Staff not found' });

    const previousSalary = staff.baseSalaryMonthly || 0;

    // update base salary
    staff.baseSalaryMonthly = salaryValue;
    await staff.save();

    // optional: log this change in SalaryAdjustment history (if you have that model)
    if (IndexModel.SalaryAdjustment) {
      await IndexModel.SalaryAdjustment.create({
        companyId,
        staffId,
        amount: salaryValue - previousSalary,
        reason: reason || 'Manual salary update',
        approvedBy: updatedBy,
        effectiveFrom: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Base salary updated successfully',
      data: {
        staffId,
        previousSalary,
        newSalary: salaryValue,
        updatedBy,
      },
    });
  } catch (err) {
    console.error('updateStaffBaseSalary error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/payroll/payments/:id/soft-delete
export const softDeletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId || req.body.companyId;
    const { reason = '' } = req.body;

    if (!companyId)
      return res
        .status(400)
        .json({ success: false, message: 'companyId required' });

    const doc = await IndexModel.StaffSalary.findOneAndUpdate(
      { _id: id, companyId, deleted: { $ne: true } },
      {
        $set: {
          deleted: true,
          deletedAt: new Date(),
          notes: reason ? `[VOID] ${reason}` : '[VOID]',
        },
      },
      { new: true }
    );
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Payment not found' });

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('softDeletePayment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//to get staff salary summary (1 staff all history by id)
export const getStaffSalarySummary = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const { staffId } = req.params;
    const { month, limit = 5 } = req.query;

    if (!companyId)
      return res
        .status(400)
        .json({ success: false, message: 'companyId required' });

    const user = await IndexModel.User.findOne(
      { _id: staffId, companyId, deleted: { $ne: true } },
      {
        name: 1,
        email: 1,
        userId: 1,
        department: 1,
        baseSalaryMonthly: 1,
        lastPaymentDate: 1,
        lastSalaryPaidMonth: 1,
      }
    ).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'Staff not found' });

    const match = { companyId, staffId: user._id, deleted: { $ne: true } };
    if (month) match.cycleMonth = month;

    const payments = await IndexModel.StaffSalary.find(match)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return res.json({
      success: true,
      data: {
        staff: user,
        recentPayments: payments,
      },
    });
  } catch (err) {
    console.error('getStaffSalarySummary error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getCompanyMonthSummary = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const month = req.query.month || yyyymm();

    if (!companyId)
      return res
        .status(400)
        .json({ success: false, message: 'companyId required' });

    const pipeline = [
      {
        $match: {
          companyId,
          cycleMonth: month,
          deleted: { $ne: true },
          status: 'paid',
        },
      },
      {
        $group: {
          _id: '$paymentType',
          count: { $sum: 1 },
          total: { $sum: '$totalPaid' },
        },
      },
    ];

    const rows = await IndexModel.StaffSalary.aggregate(pipeline);

    const out = {
      month,
      salary: { count: 0, total: 0 },
      bonus: { count: 0, total: 0 },
      decrement: { count: 0, total: 0 },
      grandTotal: 0,
    };

    rows.forEach((r) => {
      out[r._id] = { count: r.count, total: r.total };
      out.grandTotal += r.total;
    });

    return res.status(200).json({ success: true, data: out });
  } catch (err) {
    console.error('getCompanyMonthSummary error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//its getting staff data with staff salary papulted to show staff cards
const listPayments = async (req, res) => {
  try {
    // Only superAdmin can access
    if (req.user.role === 'Admin') {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: you can't access this",
      });
    }

    // Get all verified, not-deleted users
    const users = await IndexModel.User.find({
      deleted: false,
      verified: true,
      role: 'staff', // exclude superAdmin users
    }).lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
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
//its getting all the payment like all data of staff salary with staff name papulated
export const getAllSaffSalaryDetail = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId required' });
    }

    const pipeline = [
      { $match: { companyId, deleted: { $ne: true } } },
      {
        $lookup: {
          from: 'users',
          localField: 'staffId',
          foreignField: '_id',
          as: 'staff',
          pipeline: [
            { $match: { companyId, deleted: { $ne: true } } },
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
      { $addFields: { staffName: '$staff.name' } },
      // optional: decide what you return
      // { $project: { /* include/exclude fields */ } },
      { $sort: { processedAt: -1, createdAt: -1 } },
    ];

    const rows = await IndexModel.StaffSalary.aggregate(pipeline);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllStaffSalaryDetail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching activity log',
      error: error.message,
    });
  }
};

export default {
  processPayment,
  updateStaffBaseSalary,
  softDeletePayment,
  listPayments,
  getStaffSalarySummary,
  getCompanyMonthSummary,
  getAllSaffSalaryDetail,
};
