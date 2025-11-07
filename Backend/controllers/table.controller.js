import IndexModel from '../models/indexModel.js';

import mongoose from 'mongoose';
// Small helpers
const badReq = (res, msg) =>
  res.status(400).json({ success: false, error: msg });
const notFound = (res, msg = 'Table not found') =>
  res.status(404).json({ success: false, error: msg });

const createTable = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { name, seats = 2, description = '', waiterId } = req.body || {};

    if (!companyId) return badReq(res, 'Missing company scope');
    if (!name || String(name).trim() === '')
      return badReq(res, 'Table name is required');
    if (!mongoose.Types.ObjectId.isValid(waiterId))
      return badReq(res, 'Valid waiterId is required');

    // ✅ ensure waiter belongs to this company and is a waiter
    const waiter = await IndexModel.User.findOne({
      _id: waiterId,
      companyId,
      subRole: { $regex: /^waiter$/i },
      deleted: { $ne: true },
    }).lean();

    if (!waiter) return badReq(res, 'Waiter not found or invalid role');

    const doc = await IndexModel.Table.create({
      companyId,
      name: String(name).trim(),
      seats: Number(seats) || 2,
      description: String(description).trim(),
      assignedWaiterId: waiterId,
      state: 'available', // ✅ always available on create
      createdBy: userId,
    });

    return res.json({ success: true, data: doc });
  } catch (err) {
    if (err?.code === 11000) {
      return badReq(
        res,
        'A table with this name already exists in this company'
      );
    }
    return res.status(500).json({ success: false, error: err.message });
  }
};

const listTables = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return badReq(res, 'Missing company scope');

    const { state, name } = req.query;
    const q = { companyId, deleted: { $ne: true } };
    if (state) q.state = state;
    if (name) q.name = new RegExp(String(name).trim(), 'i');

    // get all tables
    const tables = await IndexModel.Table.find(q).sort({ name: 1 }).lean();

    if (!tables.length) {
      return res.json({ success: true, data: [] });
    }

    // get all active (unpaid) dine-in orders for this company
    const activeOrders = await IndexModel.Orders.find({
      companyId,
      deleted: { $ne: true },
      'dynamicAttributes.orderType': /dine/i,
      'dynamicAttributes.paymentStatus': { $ne: 'paid' },
    })
      .select([
        '_id',
        'orderNo',
        'dynamicAttributes.tableNo',
        'dynamicAttributes.paymentStatus',
        'dynamicAttributes.orderStatus',
        'dynamicAttributes.waiterId',
        'dynamicAttributes.waiterName',
        'dynamicAttributes.subTotal',
      ])
      .lean();

    // map orders by tableNo
    const orderMap = new Map();
    for (const ord of activeOrders) {
      const tableNo = ord?.dynamicAttributes?.tableNo;
      if (tableNo && !orderMap.has(tableNo)) {
        orderMap.set(tableNo, ord); // store first unpaid order found
      }
    }

    // attach isOccupied & order summary to each table
    const enriched = tables.map((t) => {
      const activeOrder = orderMap.get(String(t._id)) || null;
      return {
        ...t,
        isOccupied: !!activeOrder,
        activeOrder: activeOrder
          ? {
              _id: activeOrder._id,
              orderNo: activeOrder.orderNo,
              paymentStatus: activeOrder.dynamicAttributes?.paymentStatus,
              orderStatus: activeOrder.dynamicAttributes?.orderStatus,
              waiterId: activeOrder.dynamicAttributes?.waiterId,
              waiterName: activeOrder.dynamicAttributes?.waiterName,
              subTotal: activeOrder.dynamicAttributes?.subTotal,
            }
          : null,
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// const listTables = async (req, res) => {
//   try {
//     const companyId = req.user?.companyId;
//     if (!companyId) return badReq(res, 'Missing company scope');

//     const { state, name } = req.query;
//     const q = { companyId, deleted: { $ne: true } };
//     if (state) q.state = state;
//     if (name) q.name = new RegExp(String(name).trim(), 'i');

//     // Fetch all tables first
//     const tables = await IndexModel.Table.find(q).sort({ name: 1 }).lean();

//     // Fetch all unpaid Dine-In orders (for occupancy detection)
//     const activeOrders = await IndexModel.Order.find({
//       companyId,
//       deleted: { $ne: true },
//       'dynamicAttributes.orderType': /dine/i,
//       'dynamicAttributes.paymentStatus': { $ne: 'paid' },
//     })
//       .select(
//         '_id orderNo dynamicAttributes.tableNo dynamicAttributes.paymentStatus dynamicAttributes.waiterName dynamicAttributes.waiterId dynamicAttributes.orderStatus dynamicAttributes.subTotal'
//       )
//       .lean();

//     // Build a quick lookup: tableNo → order
//     const occupiedMap = new Map();
//     activeOrders.forEach((order) => {
//       const tableNo = order?.dynamicAttributes?.tableNo;
//       if (tableNo) {
//         occupiedMap.set(String(tableNo), order);
//       }
//     });

//     // Prepare bulk updates for state syncing
//     const bulkOps = [];

//     const result = tables.map((t) => {
//       const activeOrder = occupiedMap.get(String(t._id)) || null;
//       const isOccupied = !!activeOrder;

//       // ✅ If occupied but table.state != 'occupied', update in DB
//       if (isOccupied && t.state !== 'occupied') {
//         bulkOps.push({
//           updateOne: {
//             filter: { _id: t._id },
//             update: { $set: { state: 'occupied', updatedAt: new Date() } },
//           },
//         });
//       }

//       // ✅ If not occupied but table.state == 'occupied', free it
//       if (!isOccupied && t.state === 'occupied') {
//         bulkOps.push({
//           updateOne: {
//             filter: { _id: t._id },
//             update: { $set: { state: 'available', updatedAt: new Date() } },
//           },
//         });
//       }

//       return {
//         ...t,
//         isOccupied,
//         activeOrder: activeOrder
//           ? {
//               _id: activeOrder._id,
//               orderNo: activeOrder.orderNo,
//               paymentStatus: activeOrder.dynamicAttributes?.paymentStatus,
//               orderStatus: activeOrder.dynamicAttributes?.orderStatus,
//               waiterId: activeOrder.dynamicAttributes?.waiterId,
//               waiterName: activeOrder.dynamicAttributes?.waiterName,
//               subTotal: activeOrder.dynamicAttributes?.subTotal || 0,
//             }
//           : null,
//       };
//     });

//     // ✅ Perform state updates in bulk (only if needed)
//     if (bulkOps.length > 0) {
//       await IndexModel.Table.bulkWrite(bulkOps);
//     }

//     return res.json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// };

/**
 * Get table by id
 */
const getTable = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;
    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(id))
      return badReq(res, 'Invalid table id');

    const doc = await IndexModel.Table.findOne({
      _id: id,
      companyId,
      deleted: { $ne: true },
    });
    if (!doc) return notFound(res);
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update basic details (name, seats)
 * body: { name?, seats? }
 */
const updateTable = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(id))
      return badReq(res, 'Invalid table id');

    const patch = {};
    if (req.body?.name) patch.name = String(req.body.name).trim();
    if (req.body?.seats != null)
      patch.seats = Math.max(1, Number(req.body.seats) || 1);
    patch.updatedBy = userId;

    const doc = await IndexModel.Table.findOneAndUpdate(
      { _id: id, companyId, deleted: { $ne: true } },
      { $set: patch },
      { new: true, runValidators: true }
    );
    if (!doc) return notFound(res);
    return res.json({ success: true, data: doc });
  } catch (err) {
    if (err?.code === 11000) {
      return badReq(
        res,
        'A table with this name already exists in this company'
      );
    }
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Soft delete table
 */
const removeTable = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(id))
      return badReq(res, 'Invalid table id');

    const doc = await IndexModel.Table.findOneAndUpdate(
      { _id: id, companyId, deleted: { $ne: true } },
      { $set: { deleted: true, updatedBy: userId } },
      { new: true }
    );
    if (!doc) return notFound(res);
    return res.json({ success: true, message: 'Table deleted', data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Assign waiter (no order yet) → state = 'assigned'
 * body: { waiterId, waiterName? }
 */
const assignWaiter = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { waiterId } = req.body || {};

    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(id))
      return badReq(res, 'Invalid table id');
    if (!mongoose.Types.ObjectId.isValid(waiterId))
      return badReq(res, 'Invalid waiter id');

    const waiter = await IndexModel.User.findOne({
      _id: waiterId,
      companyId,
      subRole: { $regex: /^waiter$/i },
      deleted: { $ne: true },
    }).lean();
    if (!waiter) return notFound(res, 'Waiter not found or invalid role');

    const updated = await IndexModel.Table.findOneAndUpdate(
      { _id: id, companyId, deleted: { $ne: true } },
      {
        $set: {
          assignedWaiterId: waiterId,
          // ✅ keep whatever state it currently has; do NOT set "assigned"
          updatedBy: userId,
        },
      },
      { new: true }
    );

    if (!updated) return notFound(res, 'Table not found');

    return res.json({
      success: true,
      message: `Waiter ${waiter.name || 'selected'} assigned successfully`,
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Clear waiter assignment
 */
const clearWaiter = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(id))
      return badReq(res, 'Invalid table id');

    const doc = await IndexModel.Table.findOne({
      _id: id,
      companyId,
      deleted: { $ne: true },
    });
    if (!doc) return notFound(res);

    // If it was assigned without order/reservation → available
    const nextState =
      doc.state === 'assigned' &&
      !doc.reservation?.startISO &&
      !doc.reservation?.endISO
        ? 'available'
        : doc.state;

    doc.assignedWaiterId = null;

    doc.state = nextState;
    doc.updatedBy = userId;
    await doc.save();

    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Set reservation (auto sets state = 'reserved' by schema hook)
 * body: { startISO, endISO, name?, phone?, note? }
 */
// const setReservation = async (req, res) => {
//   try {
//     const companyId = req.user?.companyId;
//     const userId = req.user?.userId;
//     const { id } = req.params;
//     const { startISO, endISO, name, phone, note } = req.body || {};

//     if (!companyId) return badReq(res, 'Missing company scope');
//     if (!mongoose.Types.ObjectId.isValid(id))
//       return badReq(res, 'Invalid table id');
//     if (!startISO || !endISO)
//       return badReq(res, 'Reservation startISO and endISO are required');

//     const doc = await IndexModel.Table.findOne({
//       _id: id,
//       companyId,
//       deleted: { $ne: true },
//     });
//     if (!doc) return notFound(res);

//     doc.reservation = {
//       startISO: new Date(startISO),
//       endISO: new Date(endISO),
//       name: name?.trim() || undefined,
//       phone: phone?.trim() || undefined,

//       note: note?.trim() || undefined,
//     };
//     doc.updatedBy = userId;
//     await doc.save(); // pre-save hook validates times & sets state

//     return res.json({ success: true, data: doc });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// };

const setReservation = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params; // table id
    const { startISO, endISO, name, phone, note } = req.body || {};

    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(id))
      return badReq(res, 'Invalid table id');
    if (!startISO || !endISO)
      return badReq(res, 'startISO and endISO are required');

    const start = new Date(startISO);
    const end = new Date(endISO);
    if (!(start < end)) return badReq(res, 'endISO must be after startISO');

    // Build the update doc
    const newRes = {
      startISO: start,
      endISO: end,
      name: name?.trim() || undefined,
      phone: phone?.trim() || undefined,
      note: note?.trim() || undefined,
      status: Date.now() >= start && Date.now() < end ? 'active' : 'upcoming',
      createdBy: userId,
    };

    // Atomic: only push if NO overlap with active/upcoming reservations
    const updated = await IndexModel.Table.findOneAndUpdate(
      {
        _id: id,
        companyId,
        deleted: { $ne: true },
        // Reject when there's any overlapping reservation that isn't canceled/completed
        reservations: {
          $not: {
            $elemMatch: {
              status: { $in: ['upcoming', 'active'] },
              startISO: { $lt: end }, // existing starts before new ends
              endISO: { $gt: start }, // existing ends after new starts
            },
          },
        },
      },
      {
        $push: { reservations: newRes },
        // state logic: don't downgrade occupied; only mark reserved if window is active and not occupied
        $set: (() => {
          const s = {};
          const now = new Date();
          const activeNow = now >= start && now < end;
          s.updatedBy = userId;
          s.updatedAt = now;
          // We'll preserve waiter; we only touch state if not occupied.
          s.state = undefined; // default no change via $set unless needed
          return s;
        })(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        error: 'Overlapping reservation exists or table not found',
      });
    }

    // If you want to flip to reserved ONLY when not occupied and the new reservation is active:
    if (updated.state !== 'occupied') {
      const now = new Date();
      if (now >= start && now < end) {
        await IndexModel.Table.updateOne(
          { _id: updated._id },
          {
            $set: {
              state: 'reserved',
              updatedBy: userId,
              updatedAt: new Date(),
            },
          }
        );
        updated.state = 'reserved';
      }
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Cancel reservation (and optionally set state)
 * body: { makeAvailable?: boolean } // default true if no waiter assigned
 */
// const cancelReservation = async (req, res) => {
//   try {
//     const companyId = req.user?.companyId;
//     const userId = req.user?.userId;
//     const { id } = req.params;
//     const { makeAvailable } = req.body || {};

//     if (!companyId) return badReq(res, 'Missing company scope');
//     if (!mongoose.Types.ObjectId.isValid(id))
//       return badReq(res, 'Invalid table id');

//     const doc = await IndexModel.Table.findOne({
//       _id: id,
//       companyId,
//       deleted: { $ne: true },
//     });
//     if (!doc) return notFound(res);

//     doc.reservation = {};
//     // If explicitly requested or nothing else holds the table, make it available
//     const shouldFree =
//       makeAvailable === true ||
//       (!doc.assignedWaiterId && doc.state !== 'occupied');
//     if (shouldFree) doc.state = 'available';

//     doc.updatedBy = userId;
//     await doc.save();

//     return res.json({ success: true, data: doc });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// };

const cancelReservation = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id, resId } = req.params; // table id, reservation id

    if (!companyId) return badReq(res, 'Missing company scope');
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(resId)
    ) {
      return badReq(res, 'Invalid id(s)');
    }

    const updated = await IndexModel.Table.findOneAndUpdate(
      {
        _id: id,
        companyId,
        deleted: { $ne: true },
        'reservations._id': resId,
        'reservations.status': { $in: ['upcoming', 'active'] },
      },
      {
        $set: {
          'reservations.$.status': 'canceled',
          updatedBy: userId,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found or already finalized',
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Mark occupied (when a dine-in order is created) — optional helper
 */
const markOccupied = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(id))
      return badReq(res, 'Invalid table id');

    const doc = await IndexModel.Table.findOneAndUpdate(
      { _id: id, companyId, deleted: { $ne: true } },
      { $set: { state: 'occupied', updatedBy: userId } },
      { new: true }
    );
    if (!doc) return notFound(res);
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Mark awaiting payment (kitchen → served, waiter asks cashier) — optional
 */
const markAwaitingPayment = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(id))
      return badReq(res, 'Invalid table id');

    const doc = await IndexModel.Table.findOneAndUpdate(
      { _id: id, companyId, deleted: { $ne: true } },
      { $set: { state: 'awaiting_payment', updatedBy: userId } },
      { new: true }
    );
    if (!doc) return notFound(res);
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Mark available after bill paid (cashier closes order) — optional
 */
const markAvailable = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.isValidObjectId(id)) return badReq(res, 'Invalid table id');

    // Optional: only allow freeing from specific states
    const allowedFrom = ['occupied', 'assigned', 'reserved'];

    const updated = await IndexModel.Table.findOneAndUpdate(
      {
        _id: id,
        companyId,
        deleted: { $ne: true },
        // state: { $in: allowedFrom }, // ← uncomment if you want strict transitions
      },
      {
        $set: {
          state: 'available',
          assignedWaiterId: null,
          assignedWaiterName: null,
          reservation: null, // use null unless you actually store an object
          activeOrderId: null, // if you track this, clear it too
          updatedBy: userId,
        },
      },
      { new: true } // return the updated doc
    );

    if (!updated) return notFound(res, 'Table not found');

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/orders/active-dinein?tableId=<ObjectId>
 * Returns the latest unpaid Dine-In order for the given table (or null).
 */
export const getActiveDineInOrderByTable = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { tableId } = req.query;

    if (!companyId) return badReq(res, 'Missing company scope');
    if (!mongoose.Types.ObjectId.isValid(tableId))
      return badReq(res, 'Invalid tableId');

    const order = await IndexModel.Orders.findOne({
      companyId,
      deleted: { $ne: true },
      'dynamicAttributes.orderType': /dine/i,
      'dynamicAttributes.tableNo': String(tableId),
      'dynamicAttributes.paymentStatus': { $ne: 'paid' },
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: order || null });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export default {
  createTable,
  listTables,
  getTable,
  updateTable,
  removeTable,
  assignWaiter,
  clearWaiter,
  setReservation,
  cancelReservation,
  markOccupied,
  markAwaitingPayment,
  markAvailable,
  getActiveDineInOrderByTable,
};
