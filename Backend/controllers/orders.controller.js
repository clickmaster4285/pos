// controllers/order.controller.js
import IndexModel from '../models/indexModel.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;
/* ------------------------- helpers ------------------------- */
const recalcTotals = (order) => {
  // keep item.total in sync with qty*price
  order.items = (order.items || []).map((it) => ({
    ...it,
    total: Number((it.qty || 0) * (it.price || 0)) || 0,
  }));

  const subTotal = (order.items || []).reduce(
    (s, it) => s + (it.total || 0),
    0
  );
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || 0);
  const refund = Number(order.refundAmount || 0);

  order.subTotal = subTotal;
  order.grandTotal = subTotal - discount + tax - refund;
  if (order.grandTotal < 0) order.grandTotal = 0;
};

const addHistory = (order, action, performedBy, details = '') => {
  order.history = order.history || [];
  order.history.push({
    action,
    performedBy: performedBy || 'system',
    createdAt: new Date(),
    details,
  });
};

/* ------------------------- controllers ------------------------- */

const createOrder = async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId)
      return res
        .status(400)
        .json({ success: false, error: 'companyId is required' });
    const performedBy = req.user?.userId || 'system';
    const {
      customerName,
      customerPhone,
      items = [],
      paymentStatus = 'unpaid',
      shippingAddressId,
      orderStatus = 'pending',
      dynamicAttributes = {},
    } = req.body;

    // basic validations
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, error: 'companyId is required (in params)' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'items must be a non-empty array' });
    }

    // simple shape validation for items
    for (const [i, it] of items.entries()) {
      if (!it.name)
        return res
          .status(400)
          .json({ success: false, error: `items[${i}].name is required` });
      if (!Number.isFinite(it.price))
        return res.status(400).json({
          success: false,
          error: `items[${i}].price must be a number`,
        });
      if (!Number.isInteger(it.qty) || it.qty <= 0) {
        return res.status(400).json({
          success: false,
          error: `items[${i}].qty must be a positive integer`,
        });
      }
    }

    /* ===== CHECK #1: validate productIds + fetch recipe ===== */

    const productIdSet = new Set(
      items.map((it) => it.productId).filter(Boolean)
    );
    const productIds = [...productIdSet];

    const invalidIds = productIds.filter((id) => !ObjectId.isValid(id));
    if (invalidIds.length) {
      return res.status(400).json({
        success: false,
        error: `Invalid productId(s): ${invalidIds.join(', ')}`,
      });
    }

    // pull productName and ingredient array so we can compute recipe usage
    const productDocs = await IndexModel.Product.find(
      {
        _id: { $in: productIds },
        companyId,
        deleted: { $ne: true },
        isActive: { $ne: false },
      },
      { _id: 1, productName: 1, ingredient: 1 }
    ).lean();

    const foundSet = new Set(productDocs.map((p) => String(p._id)));
    const missing = productIds.filter((id) => !foundSet.has(String(id)));

    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: `Unknown or unavailable productId(s) for this company: ${missing.join(
          ', '
        )}`,
      });
    }

    // quick lookup for later
    const productsById = new Map(productDocs.map((p) => [String(p._id), p]));

    /* ===== Compute ingredient demand from ordered items ===== */
    // Result example: { "ingredientObjectId": 1.6, ... }
    const ingredientDemand = {};

    for (const it of items) {
      const p = productsById.get(String(it.productId));
      if (!p) continue; // safety

      const qtyOrdered = Number(it.qty) || 0;

      for (const rec of p.ingredient || []) {
        const ingId = String(rec.ingredientId || '');
        if (!ingId) continue;

        // rec.quantity is like "0.2" per product unit
        const perUnitQty = Number(rec.quantity);
        if (!Number.isFinite(perUnitQty) || perUnitQty < 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid ingredient quantity in recipe for product "${p.productName}"`,
          });
        }

        const need = perUnitQty * qtyOrdered;
        ingredientDemand[ingId] = (ingredientDemand[ingId] || 0) + need;
      }
    }
    /* ===== Verify ingredient stock ===== */
    const ingIds = Object.keys(ingredientDemand);

    if (ingIds.length) {
      const ingDocs = await IndexModel.Ingredient.find(
        {
          _id: { $in: ingIds },
          companyId,
          deleted: { $ne: true },
          isActive: { $ne: false },
        },
        { _id: 1, name: 1, unit: 1, currentStock: 1 }
      ).lean();

      const ingById = new Map(ingDocs.map((d) => [String(d._id), d]));

      for (const ingId of ingIds) {
        const need = ingredientDemand[ingId];
        const doc = ingById.get(ingId);
        if (!doc) {
          return res.status(400).json({
            success: false,
            error: `Ingredient not found or inactive: ${ingId}`,
          });
        }
        if (Number(doc.currentStock) < need) {
          return res.status(400).json({
            success: false,
            error: `Insufficient ingredient "${doc.name}" stock. Available ${
              doc.currentStock
            } ${doc.unit || ''}, required ${need}`,
          });
        }
      }
    }

    /* ===== NEW CHECK #2: if Dine-In + table selected, block when occupied ===== */
    {
      const orderType = dynamicAttributes?.orderType?.toLowerCase?.() || '';
      const tableIdRaw = dynamicAttributes?.tableNo || '';
      const tableId = String(tableIdRaw || '');

      if (orderType === 'dine-in' && tableId) {
        if (!ObjectId.isValid(tableId)) {
          return res.status(400).json({
            success: false,
            error: `Invalid table id: ${tableId}`,
          });
        }

        const tableDoc = await IndexModel.Table.findOne(
          { _id: tableId, companyId, deleted: { $ne: true } },
          { _id: 1, state: 1, name: 1 }
        ).lean();

        if (!tableDoc) {
          return res.status(400).json({
            success: false,
            error: `Table not found for this company`,
          });
        }

        if (tableDoc.state === 'occupied') {
          return res.status(409).json({
            success: false,
            error: `Table "${tableDoc.name || tableId}" is currently occupied`,
          });
        }
      }
    }

    // --- Pre-check stock: ensure sufficient quantity per product (sum duplicates) ---
    const wantedByProduct = items.reduce((acc, it) => {
      const id = String(it.productId);
      acc[id] = (acc[id] || 0) + Number(it.qty);
      return acc;
    }, {});

    const stockProducts = await IndexModel.Product.find(
      { _id: { $in: Object.keys(wantedByProduct) } },
      { _id: 1, productName: 1, quantity: 1 }
    ).lean();

    for (const p of stockProducts) {
      const need = wantedByProduct[String(p._id)] || 0;
      if (Number(p.quantity) < need) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${p.productName}. Available ${p.quantity}, requested ${need}`,
        });
      }
    }

    // generate order number per company
    const orderNo = await generateOrderNumber(companyId);

    if (!orderNo) {
      return res
        .status(500)
        .json({ success: false, error: 'Failed to generate order number' });
    }

    const order = new IndexModel.Orders({
      companyId,
      orderNo,
      customerName,
      customerPhone,
      items,
      paymentStatus,
      shippingAddressId,
      orderStatus,
      dynamicAttributes,
      createdBy: performedBy,
    });

    recalcTotals(order);
    addHistory(order, 'create', performedBy, 'Order created');

    const saved = await order.save();

    //--------- inventory deduction in bulk ...------------------------
    const now = new Date();
    const bulkOps = items.map((it) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(it.productId),
          companyId,
          deleted: { $ne: true },
          isActive: { $ne: false },
          quantity: { $gte: Number(it.qty) },
        },
        update: {
          $inc: { quantity: -Number(it.qty), totalOrdered: Number(it.qty) },
          $push: {
            history: {
              action: `Order ${orderNo}: -${it.qty} ${it.name}`,
              performedBy,
              at: now,
            },
          },
          $set: { updatedAt: now },
        },
      },
    }));

    if (bulkOps.length) {
      const invResult = await IndexModel.Product.bulkWrite(bulkOps, {
        ordered: true,
      });
      const matched = invResult.matchedCount ?? invResult.result?.nMatched ?? 0;
      if (matched !== bulkOps.length)
        throw new Error('Stock update failed for one or more items');
    }

    /* ===== Ingredient stock deduction (bulk) ===== */
    const ingredientBulkOps = Object.entries(ingredientDemand).map(
      ([ingId, need]) => ({
        updateOne: {
          filter: {
            _id: new ObjectId(ingId),
            companyId,
            deleted: { $ne: true },
            isActive: { $ne: false },
            currentStock: { $gte: need },
          },
          update: {
            $inc: { currentStock: -need },
            $push: {
              history: {
                action: 'CONSUMED',
                performedBy,
                timestamp: now,
                details: `Order ${orderNo}: -${need}`,
              },
            },
            $set: { updatedAt: now },
          },
        },
      })
    );

    if (ingredientBulkOps.length) {
      const ingResult = await IndexModel.Ingredient.bulkWrite(
        ingredientBulkOps,
        { ordered: true }
      );
      const matchedIng =
        ingResult.matchedCount ?? ingResult.result?.nMatched ?? 0;
      if (matchedIng !== ingredientBulkOps.length) {
        throw new Error('Ingredient stock update failed for one or more items');
      }
    }

    // === Auto-update table status for Dine-In (unpaid) ===
    const tableNoRaw =
      dynamicAttributes?.tableNo ||
      (order.dynamicAttributes?.get
        ? order.dynamicAttributes.get('tableNo')
        : undefined);

    const isDineIn =
      dynamicAttributes?.orderType?.toLowerCase?.() === 'dine-in' ||
      order.dynamicAttributes?.get?.('orderType')?.toLowerCase?.() ===
        'dine-in';

    const tableIdForUpdate =
      typeof tableNoRaw === 'string' ? tableNoRaw : String(tableNoRaw || '');

    if (isDineIn && tableIdForUpdate && paymentStatus === 'unpaid') {
      await IndexModel.Table.findOneAndUpdate(
        { _id: tableIdForUpdate, companyId, deleted: { $ne: true } },
        {
          $set: {
            state: 'occupied',
            updatedBy: performedBy,
            updatedAt: new Date(),
          },
        },
        { new: true }
      ).lean();
    }

    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// List orders (by company) + light filters + pagination
const listCompanyOrders = async (req, res) => {
  try {
    const { companyId } = req.user;
    const subRole = req.user.subRole;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, error: 'companyId is required (in params)' });
    }

    const {
      status, // orderStatus
      paymentStatus, // unpaid | partial | paid
      q, // search in orderNo or phone
      page = 1,
      limit = 20,
    } = req.query;

    const where = { companyId, deleted: { $ne: true } };

    if (String(subRole || '').toLowerCase() === 'waiter') {
      where['dynamicAttributes.orderType'] = 'Dine-In';
    }

    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (q) {
      where.$or = [
        { orderNo: new RegExp(q, 'i') },
        { customerPhone: new RegExp(q, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [rows, total] = await Promise.all([
      IndexModel.Orders.find(where)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      IndexModel.Orders.countDocuments(where),
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get single order
const getOrderById = async (req, res) => {
  try {
    const { id, companyId } = req.user;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid order ID' });
    }

    const doc = await IndexModel.Orders.findOne({
      _id: id,
      companyId,
      deleted: { $ne: true },
    }).lean();
    if (!doc)
      return res.status(404).json({ success: false, error: 'Order not found' });

    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Cancel whole order (simple flow)
// const cancelOrder = async (req, res) => {
//   try {
//     const { id, companyId } = req.user;
//     const performedBy = req.user?.userId || 'system';

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res
//         .status(400)
//         .json({ success: false, error: 'Invalid order ID' });
//     }

//     const doc = await IndexModel.Orders.findOne({
//       _id: id,
//       companyId,
//       deleted: { $ne: true },
//     });
//     if (!doc)
//       return res.status(404).json({ success: false, error: 'Order not found' });

//     if (['cancelled', 'delivered'].includes(doc.orderStatus)) {
//       return res
//         .status(400)
//         .json({ success: false, error: `Order already ${doc.orderStatus}` });
//     }

//     doc.orderStatus = 'cancelled';
//     addHistory(doc, 'cancel', performedBy, 'Order cancelled');
//     await doc.save();

//     return res.json({ success: true, message: 'Order cancelled', data: doc });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// };

const cancelOrder = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const performedBy = userId || 'system';
    const orderId = req.params.id;

    // Basic validation
    if (!ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid order ID' });
    }

    // Fetch order
    const doc = await IndexModel.Orders.findOne({
      _id: orderId,
      companyId,
      deleted: { $ne: true },
    });

    if (!doc)
      return res.status(404).json({ success: false, error: 'Order not found' });

    if (['cancelled', 'delivered'].includes(doc.orderStatus)) {
      return res
        .status(400)
        .json({ success: false, error: `Order already ${doc.orderStatus}` });
    }

    // === Restore inventory for all items ===
    const items = Array.isArray(doc.items) ? doc.items : [];
    const now = new Date();
    const orderNo = doc.orderNo || doc.orderNumber || String(doc._id);

    const bulkOps = items.map((it) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(it.productId),
          companyId,
          deleted: { $ne: true },
          isActive: { $ne: false },
        },
        update: {
          $inc: { quantity: Number(it.qty), totalOrdered: -Number(it.qty) },
          $push: {
            history: {
              action: `Cancel ${orderNo}: +${it.qty} ${it.name}`,
              performedBy,
              at: now,
            },
          },
          $set: { updatedAt: now },
        },
      },
    }));

    if (bulkOps.length) {
      const invResult = await IndexModel.Product.bulkWrite(bulkOps, {
        ordered: true,
      });
      const matched = invResult.matchedCount ?? invResult.result?.nMatched ?? 0;

      if (matched !== bulkOps.length) {
        throw new Error('Stock restoration failed for one or more items');
      }
    }

    // === Free table if Dine-In order ===
    const orderType =
      doc.dynamicAttributes?.orderType ||
      (doc.dynamicAttributes?.get
        ? doc.dynamicAttributes.get('orderType')
        : '');
    const isDineIn = String(orderType || '').toLowerCase() === 'dine-in';

    const rawTableId =
      doc.dynamicAttributes?.tableNo ||
      (doc.dynamicAttributes?.get ? doc.dynamicAttributes.get('tableNo') : '');

    const tableId = String(rawTableId || '');
    if (isDineIn && ObjectId.isValid(tableId)) {
      await IndexModel.Table.findOneAndUpdate(
        { _id: tableId, companyId, deleted: { $ne: true } },
        {
          $set: {
            state: 'available',
            updatedBy: performedBy,
            updatedAt: new Date(),
          },
        },
        { new: true }
      ).lean();
    }

    // === Update order status ===
    doc.orderStatus = 'cancelled';
    addHistory(doc, 'cancel', performedBy, 'Order cancelled, stock restored');
    await doc.save();

    return res.json({
      success: true,
      message: 'Order cancelled and stock restored',
      data: doc,
    });
  } catch (err) {
    console.error('Cancel Order Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Refund order (amount-based, no separate Refund entity)
// const refundOrder = async (req, res) => {
//   try {
//     const { id, companyId } = req.user;
//     const performedBy = req.user?.userId || 'system';
//     const { amount = 0, note } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res
//         .status(400)
//         .json({ success: false, error: 'Invalid order ID' });
//     }
//     if (!Number.isFinite(amount) || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Refund amount must be a positive number',
//       });
//     }

//     const doc = await IndexModel.Orders.findOne({
//       _id: id,
//       companyId,
//       deleted: { $ne: true },
//     });
//     if (!doc)
//       return res.status(404).json({ success: false, error: 'Order not found' });

//     // Apply refund
//     doc.refundAmount = Number(doc.refundAmount || 0) + Number(amount);

//     // Recalc totals and adjust payment status
//     recalcTotals(doc);

//     // Payment status policy (simple, matches your enum):
//     // if any refund applied and grandTotal > 0 → partial
//     // if grandTotal === 0 → paid (net due zero)
//     if (doc.refundAmount > 0 && doc.grandTotal > 0) {
//       doc.paymentStatus = 'partial';
//     } else if (doc.grandTotal === 0) {
//       doc.paymentStatus = 'paid';
//     }

//     addHistory(
//       doc,
//       'refund',
//       performedBy,
//       `Refunded ${amount}${note ? ` - ${note}` : ''}`
//     );
//     await doc.save();

//     return res.json({ success: true, message: 'Refund applied', data: doc });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// };

// controllers/order.controller.js (add below other handlers)

const allowedStatuses = new Set([
  'pending',
  'cooking',
  'ready',
  'collected',
  'handed_over',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned_request',
  'returned_accept',
  'returned_reject',
]);

const allowedList = Array.from(allowedStatuses); // for error message

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user || {};
    const performedBy = req.user?.userId || 'system';

    // accept both "status" and "orderStatus"
    const rawStatus = (
      req.body.status ??
      req.body.orderStatus ??
      ''
    ).toString();
    const status = rawStatus.trim().toLowerCase();
    const note = (req.body.note ?? '').toString().trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid order ID' });
    }

    if (!status || !allowedStatuses.has(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${allowedList.join(', ')}`,
      });
    }

    const doc = await IndexModel.Orders.findOne({
      _id: id,
      companyId,
      deleted: { $ne: true },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const willCancel =
      status === 'cancelled' && doc.orderStatus !== 'cancelled';
    const current = (doc.orderStatus || '').toString().toLowerCase();

    // guardrails
    if (current === 'cancelled' && status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cancelled orders cannot change status',
      });
    }

    const isReturnFlow = status.startsWith('returned_');
    if (current === 'delivered' && !isReturnFlow && status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Delivered orders can only move into return statuses',
      });
    }

    if (current === status) {
      return res.json({
        success: true,
        message: 'Status unchanged',
        data: doc,
      });
    }

    // apply
    doc.orderStatus = status;

    // history (safe note)
    addHistory(
      doc,
      'status_update',
      performedBy,
      `status: ${current || '-'} -> ${status}${note ? ` | ${note}` : ''}`
    );

    await doc.save();
    if (willCancel) {
      try {
        const items = Array.isArray(doc.items) ? doc.items : [];
        const now = new Date();
        const orderNo = doc.orderNo || doc.orderNumber || String(doc._id);

        const bulkOps = items
          .filter(
            (it) =>
              mongoose.Types.ObjectId.isValid(String(it.productId)) &&
              Number(it.qty) > 0
          )
          .map((it) => ({
            updateOne: {
              filter: {
                _id: new mongoose.Types.ObjectId(String(it.productId)),
                companyId,
                deleted: { $ne: true },
                isActive: { $ne: false },
              },
              update: {
                $inc: {
                  quantity: Number(it.qty),
                  totalOrdered: -Number(it.qty),
                },
                $push: {
                  history: {
                    action: `Order ${orderNo} cancelled: +${it.qty} ${
                      it.name || it.itemName || 'item'
                    }`,
                    performedBy,
                    at: now,
                  },
                },
                $set: { updatedAt: now },
              },
            },
          }));

        if (bulkOps.length) {
          await IndexModel.Product.bulkWrite(bulkOps, { ordered: true });
        }

        console.log(`✅ Stock restored for cancelled order ${orderNo}`);
      } catch (err) {
        console.error(
          `⚠️ Failed to restore stock for cancelled order: ${err.message}`
        );
      }
    }
    return res.json({
      success: true,
      message: 'Order status updated',
      data: doc,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export default {
  createOrder,
  listCompanyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};
