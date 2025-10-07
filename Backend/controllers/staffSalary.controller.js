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

/**
 * POST /payroll/pay
 * Body: { staffId, paymentType: 'salary'|'bonus'|'decrement', bonusAmount?, decrementAmount?, notes?, cycleMonth? }
 */
// const processPayment = async (req, res) => {
//   try {
//     const companyId = req.user?.companyId || req.body.companyId; // fallback if needed
//     const processedBy = req.user?.userId || 'system';

//     const {
//       staffId,
//       paymentType, // 'salary' | 'bonus' | 'decrement'
//       bonusAmount = 0,
//       decrementAmount = 0,
//       notes = '',
//       cycleMonth = yyyymm(),
//     } = req.body;

//     // Validate basic fields
//     if (!companyId)
//       return res
//         .status(400)
//         .json({ success: false, message: 'companyId required' });
//     if (!staffId)
//       return res
//         .status(400)
//         .json({ success: false, message: 'staffId required' });
//     if (!['salary', 'bonus', 'decrement'].includes(paymentType))
//       return res
//         .status(400)
//         .json({ success: false, message: 'Invalid paymentType' });

//     // Fetch staff user
//     const staff = await IndexModel.User.findOne({
//       _id: staffId,
//       companyId,
//       deleted: { $ne: true },
//     });

//     if (!staff)
//       return res
//         .status(404)
//         .json({ success: false, message: 'Staff not found' });

//     const baseSalary = getBaseMonthly(staff);
//     if (baseSalary <= 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Staff base monthly salary not set' });
//     }

//     const bonus = safeNumber(bonusAmount, 0);
//     const dec = safeNumber(decrementAmount, 0);

//     // Prevent duplicate base salary payout for same month
//     if (paymentType === 'salary') {
//       const exists = await IndexModel.StaffSalary.findOne({
//         companyId,
//         staffId,
//         cycleMonth,
//         paymentType: 'salary',
//         deleted: { $ne: true },
//       }).lean();

//       if (exists) {
//         return res.status(409).json({
//           success: false,
//           message: `Salary already processed for ${cycleMonth}`,
//         });
//       }
//     }

//     // Compute total to be paid
//     let totalPaid = baseSalary;
//     if (paymentType === 'bonus') totalPaid = baseSalary + bonus;
//     if (paymentType === 'decrement') totalPaid = Math.max(0, baseSalary - dec);

//     // Create salary record
//     const doc = await IndexModel.StaffSalary.create({
//       companyId,
//       staffId,
//       baseSalary,
//       paymentType,
//       bonusAmount: paymentType === 'bonus' ? bonus : 0,
//       decrementAmount: paymentType === 'decrement' ? dec : 0,
//       totalPaid,
//       cycleMonth,
//       processedBy,
//       notes,
//       status: 'paid',
//     });

//     // ✅ Update staff's payment tracking info
//     await IndexModel.User.updateOne(
//       { _id: staffId, companyId },
//       {
//         $set: {
//           lastPaymentDate: new Date(), // update the new field
//           lastSalaryPaidMonth: cycleMonth, // record which month was paid
//         },
//       }
//     );

//     return res.status(201).json({ success: true, data: doc });
//   } catch (err) {
//     console.error('processPayment error:', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
export const processPayment = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    const processedBy = req.user?.userId || 'system';
    const {
      staffId,
      paymentType, // "salary" | "bonus" | "decrement"
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
    if (!['salary', 'bonus', 'decrement'].includes(paymentType))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid paymentType' });

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
    if (baseSalary <= 0)
      return res
        .status(400)
        .json({ success: false, message: 'Staff base monthly salary not set' });

    const bonus = safeNumber(bonusAmount, 0);
    const dec = safeNumber(decrementAmount, 0);

    // Block paying base salary twice in same cycle
    if (paymentType === 'salary') {
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
    }

    // compute total
    let totalPaid = baseSalary;
    if (paymentType === 'bonus') totalPaid = baseSalary + bonus;
    if (paymentType === 'decrement') totalPaid = Math.max(0, baseSalary - dec);

    // create payment record
    const doc = await IndexModel.StaffSalary.create({
      companyId,
      staffId,
      baseSalary,
      paymentType,
      bonusAmount: paymentType === 'bonus' ? bonus : 0,
      decrementAmount: paymentType === 'decrement' ? dec : 0,
      totalPaid,
      cycleMonth,
      processedBy,
      notes,
      status: 'paid',
    });

    // ✅ Atomically update user
    const userUpdate = {
      lastPaymentDate: new Date(),
      lastSalaryPaidMonth: cycleMonth,
    };
    await IndexModel.User.updateOne(
      { _id: staffId, companyId, deleted: { $ne: true } },
      { $set: userUpdate }
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

// GET /api/payroll/payments?companyId=&staffId=&month=&type=&page=1&limit=10
// export const listPayments = async (req, res) => {
//   try {
//     const companyId = req.user?.companyId || req.query.companyId;
//     const { staffId, month, type, page = 1, limit = 10 } = req.query;

//     if (!companyId)
//       return res
//         .status(400)
//         .json({ success: false, message: 'companyId required' });

//     const match = { companyId, deleted: { $ne: true } };
//     if (staffId)
//       match.staffId = new IndexModel.mongoose.Types.ObjectId(staffId);
//     if (month) match.cycleMonth = month;
//     if (type) match.paymentType = type;

//     const skip = (Number(page) - 1) * Number(limit);

//     const pipeline = [
//       { $match: match },
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: Number(limit) },
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'staffId',
//           foreignField: '_id',
//           as: 'staff',
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 email: 1,
//                 userId: 1,
//                 department: 1,
//                 baseSalaryMonthly: 1,
//                 lastPaymentDate: 1,
//                 lastSalaryPaidMonth: 1,
//               },
//             },
//           ],
//         },
//       },
//       { $unwind: '$staff' },
//     ];

//     const [items, total] = await Promise.all([
//       IndexModel.StaffSalary.aggregate(pipeline),
//       IndexModel.StaffSalary.countDocuments(match),
//     ]);

//     return res.json({
//       success: true,
//       data: items,
//       meta: {
//         total,
//         page: Number(page),
//         limit: Number(limit),
//         pages: Math.max(1, Math.ceil(total / Number(limit))),
//       },
//     });
//   } catch (err) {
//     console.error('listPayments error:', err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// GET /api/payroll/staff/:staffId/summary?month=&limit=5
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

const listPayments = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId required' });
    }

    // 1) Get all verified, not-deleted users (exclude superAdmin)
    const users = await IndexModel.User.find(
      {
        companyId,
        deleted: false,
        verified: true,
        role: { $ne: 'superAdmin' },
      },
      {
        // projection: include only fields you need
        _id: 1,
        userId: 1,
        name: 1,
        email: 1,
        address: 1,
        subRole: 1,
        phone: 1,
        department: 1,
        baseSalaryMonthly: 1,
        lastPaymentDate: 1,
        lastSalaryPaidMonth: 1,
      }
    ).lean();

    // 2) For each user, fetch their company plan (adjust model if needed)
    const data = await Promise.all(
      users.map(async (user) => {
        // Replace CompanyPlan with whatever model actually stores "plan"
        const planDoc =
          (IndexModel.CompanyPlan &&
            (await IndexModel.CompanyPlan.findOne({
              companyId: user.companyId,
            }).lean())) ||
          null;

        return {
          ...user,
          plan: planDoc ? planDoc.plan : null, // or whatever field holds plan name/tier
        };
      })
    );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching users',
      details: error.message,
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
};
