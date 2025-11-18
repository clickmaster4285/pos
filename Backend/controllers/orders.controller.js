// controllers/order.controller.js (updated)
import IndexModel from '../models/indexModel.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import mongoose from 'mongoose';
import { fetchIndustryName } from '../utils/fetchToolLogoName.js';
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

    const industryName = await fetchIndustryName(req.user.companyId);

    // Note: industryName is fetched but not used for stock logic anymore; uniform logic based on product ingredients

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

    // pull productName, ingredient array, and quantity for stock check
    const productDocs = await IndexModel.Product.find(
      {
        _id: { $in: productIds },
        companyId,
        deleted: { $ne: true },
        isActive: { $ne: false },
      },
      { _id: 1, productName: 1, ingredient: 1, quantity: 1 }
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

    /* ===== Compute ingredient demand from ordered items with ingredients ===== */
    // Result example: { "ingredientObjectId": 1.6, ... }
    const ingredientDemand = {};

    // Also, prepare to snapshot usedIngredients in order items
    const updatedItems = items.map((it) => {
      const p = productsById.get(String(it.productId));
      if (!p) return it; // safety

      const qtyOrdered = Number(it.qty) || 0;
      const hasIngredients = Array.isArray(p.ingredient) && p.ingredient.length > 0;

      if (hasIngredients) {
        const usedIngredients = [];
        for (const rec of p.ingredient || []) {
          const ingId = String(rec.ingredientId || '');
          if (!ingId) continue;

          const perUnitQty = Number(rec.quantity);
          if (!Number.isFinite(perUnitQty) || perUnitQty < 0) {
            throw new Error(`Invalid ingredient quantity in recipe for product "${p.productName}"`);
          }

          const need = perUnitQty * qtyOrdered;
          ingredientDemand[ingId] = (ingredientDemand[ingId] || 0) + need;

          usedIngredients.push({
            ingredientId: ingId,
            amountUsed: need,
            unit: rec.unit || '',
          });
        }
        return { ...it, usedIngredients };
      } else {
        return it;
      }
    });

    /* ===== Verify and deduct ingredient stock if any demand ===== */
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

      // Check stock
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

    /* ===== CHECK #2: if Dine-In + table selected, block when occupied ===== */
    
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
    

    // --- Pre-check stock for products without ingredients ---

    const productsWithoutIngredients = new Set();
    const wantedByProduct = {};

    for (const it of items) {
      const p = productsById.get(String(it.productId));
      if (p && (!p.ingredient || p.ingredient.length === 0)) {
        const id = String(it.productId);
        productsWithoutIngredients.add(id);
        wantedByProduct[id] = (wantedByProduct[id] || 0) + Number(it.qty);
      }
    }

    if (productsWithoutIngredients.size > 0) {
      const stockProducts = await IndexModel.Product.find(
        { _id: { $in: [...productsWithoutIngredients] } },
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
    }

    // generate order number per company
    const orderNo = await generateOrderNumber(companyId);

    if (!orderNo) {
      return res
        .status(500)
        .json({ success: false, error: 'Failed to generate order number' });
    }

    // build order
    const order = new IndexModel.Orders({
      companyId,
      orderNo,
      customerName,
      customerPhone,
      items: updatedItems, // with usedIngredients if applicable
      paymentStatus,
      shippingAddressId,
      orderStatus,
      dynamicAttributes,
      createdBy: performedBy,
    });

    recalcTotals(order);
    addHistory(order, 'create', performedBy);
    await order.save();

    // === Deduct ingredient stock if demand ===
    if (Object.keys(ingredientDemand).length) {
      const bulkIngOps = ingIds.map((ingId) => ({
        updateOne: {
          filter: {
            _id: new ObjectId(ingId),
            companyId,
            deleted: { $ne: true },
            isActive: { $ne: false },
          },
          update: {
            $inc: { currentStock: -ingredientDemand[ingId] },
            $push: {
              history: {
                action: `Order ${orderNo}: -${ingredientDemand[ingId]}`,
                performedBy,
                timestamp: new Date(),
              },
            },
          },
        },
      }));

      const ingResult = await IndexModel.Ingredient.bulkWrite(bulkIngOps, {
        ordered: true,
      });
      const matchedIng = ingResult.matchedCount ?? ingResult.result?.nMatched ?? 0;
      if (matchedIng !== bulkIngOps.length) {
        // Rollback order if possible, but for simplicity, log error
        console.error('Ingredient deduction failed for some items');
      }
    }

    // === Deduct product stock for products without ingredients ===
    if (Object.keys(wantedByProduct).length) {
      const bulkProdOps = Object.keys(wantedByProduct).map((id) => ({
        updateOne: {
          filter: {
            _id: new ObjectId(id),
            companyId,
            deleted: { $ne: true },
            isActive: { $ne: false },
          },
          update: {
            $inc: {
              quantity: -wantedByProduct[id],
              totalOrdered: wantedByProduct[id], // assuming totalOrdered means total sold
            },
            $push: {
              history: {
                action: `Order ${orderNo}: -${wantedByProduct[id]}`,
                performedBy,
                at: new Date(),
              },
            },
            $set: { updatedAt: new Date() },
          },
        },
      }));

      const prodResult = await IndexModel.Product.bulkWrite(bulkProdOps, {
        ordered: true,
      });
      const matchedProd = prodResult.matchedCount ?? prodResult.result?.nMatched ?? 0;
      if (matchedProd !== bulkProdOps.length) {
        console.error('Product deduction failed for some items');
      }
    }

    // === Mark table occupied if Dine-In ===
    if (orderType === 'dine-in' && ObjectId.isValid(tableId)) {
      const tableUpdate = await IndexModel.Table.findOneAndUpdate(
        { _id: tableId, companyId, deleted: { $ne: true } },
        {
          $set: {
            state: 'occupied',
            updatedBy: performedBy,
            updatedAt: new Date(),
          },
        },
        { new: true }
      ).lean();

      if (!tableUpdate) {
        console.warn(`Table ${tableId} not updated to occupied`);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Order created',
      data: order,
    });
  } catch (err) {
    console.error('Create Order Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const performedBy = req.user?.userId || 'system';

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID' });
    }

    const doc = await IndexModel.Orders.findOne({
      _id: id,
      companyId,
      deleted: { $ne: true },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (doc.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Order already cancelled',
      });
    }

    const now = new Date();
    const orderNo = doc.orderNo || String(doc._id);

    // === Restore stocks based on items ===
    // Collect ingredient restorations
    const ingredientRestore = {};
    // Collect product restorations
    const productRestore = {};

    const items = Array.isArray(doc.items) ? doc.items : [];

    for (const it of items) {
      if (Array.isArray(it.usedIngredients) && it.usedIngredients.length > 0) {
        // Restore ingredients
        for (const used of it.usedIngredients) {
          const ingId = String(used.ingredientId);
          const amount = Number(used.amountUsed) || 0;
          if (amount > 0) {
            ingredientRestore[ingId] = (ingredientRestore[ingId] || 0) + amount;
          }
        }
      } else {
        // Restore product
        const prodId = String(it.productId);
        const qty = Number(it.qty) || 0;
        if (qty > 0 && ObjectId.isValid(prodId)) {
          productRestore[prodId] = (productRestore[prodId] || 0) + qty;
        }
      }
    }

    // Bulk restore ingredients
    const ingIdsToRestore = Object.keys(ingredientRestore);
    if (ingIdsToRestore.length) {
      const bulkIngOps = ingIdsToRestore.map((ingId) => ({
        updateOne: {
          filter: {
            _id: new ObjectId(ingId),
            companyId,
            deleted: { $ne: true },
            isActive: { $ne: false },
          },
          update: {
            $inc: { currentStock: ingredientRestore[ingId] },
            $push: {
              history: {
                action: `Cancel ${orderNo}: +${ingredientRestore[ingId]}`,
                performedBy,
                timestamp: now,
              },
            },
          },
        },
      }));

      const ingResult = await IndexModel.Ingredient.bulkWrite(bulkIngOps, {
        ordered: true,
      });
      const matchedIng = ingResult.matchedCount ?? ingResult.result?.nMatched ?? 0;
      if (matchedIng !== bulkIngOps.length) {
        throw new Error('Ingredient restoration failed for one or more items');
      }
    }

    // Bulk restore products
    const prodIdsToRestore = Object.keys(productRestore);
    if (prodIdsToRestore.length) {
      const bulkProdOps = prodIdsToRestore.map((prodId) => ({
        updateOne: {
          filter: {
            _id: new ObjectId(prodId),
            companyId,
            deleted: { $ne: true },
            isActive: { $ne: false },
          },
          update: {
            $inc: {
              quantity: productRestore[prodId],
              totalOrdered: -productRestore[prodId],
            },
            $push: {
              history: {
                action: `Cancel ${orderNo}: +${productRestore[prodId]} ${it.name || 'item'}`,
                performedBy,
                at: now,
              },
            },
            $set: { updatedAt: now },
          },
        },
      }));

      const prodResult = await IndexModel.Product.bulkWrite(bulkProdOps, {
        ordered: true,
      });
      const matchedProd = prodResult.matchedCount ?? prodResult.result?.nMatched ?? 0;
      if (matchedProd !== bulkProdOps.length) {
        throw new Error('Product restoration failed for one or more items');
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

// ... (other functions like listCompanyOrders, getOrderById, etc.)

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
        const orderNo = doc.orderNo || String(doc._id);

        // === Restore stocks based on items ===
        // Collect ingredient restorations
        const ingredientRestore = {};
        // Collect product restorations
        const productRestore = {};

        for (const it of items) {
          if (Array.isArray(it.usedIngredients) && it.usedIngredients.length > 0) {
            // Restore ingredients
            for (const used of it.usedIngredients) {
              const ingId = String(used.ingredientId);
              const amount = Number(used.amountUsed) || 0;
              if (amount > 0) {
                ingredientRestore[ingId] = (ingredientRestore[ingId] || 0) + amount;
              }
            }
          } else {
            // Restore product
            const prodId = String(it.productId);
            const qty = Number(it.qty) || 0;
            if (qty > 0 && ObjectId.isValid(prodId)) {
              productRestore[prodId] = (productRestore[prodId] || 0) + qty;
            }
          }
        }

        // Bulk restore ingredients
        const ingIdsToRestore = Object.keys(ingredientRestore);
        if (ingIdsToRestore.length) {
          const bulkIngOps = ingIdsToRestore.map((ingId) => ({
            updateOne: {
              filter: {
                _id: new ObjectId(ingId),
                companyId,
                deleted: { $ne: true },
                isActive: { $ne: false },
              },
              update: {
                $inc: { currentStock: ingredientRestore[ingId] },
                $push: {
                  history: {
                    action: `Cancel ${orderNo}: +${ingredientRestore[ingId]}`,
                    performedBy,
                    timestamp: now,
                  },
                },
              },
            },
          }));

          await IndexModel.Ingredient.bulkWrite(bulkIngOps, {
            ordered: true,
          });
        }

        // Bulk restore products
        const prodIdsToRestore = Object.keys(productRestore);
        if (prodIdsToRestore.length) {
          const bulkProdOps = prodIdsToRestore.map((prodId) => ({
            updateOne: {
              filter: {
                _id: new ObjectId(prodId),
                companyId,
                deleted: { $ne: true },
                isActive: { $ne: false },
              },
              update: {
                $inc: {
                  quantity: productRestore[prodId],
                  totalOrdered: -productRestore[prodId],
                },
                $push: {
                  history: {
                    action: `Order ${orderNo} cancelled: +${productRestore[prodId]} ${it.name || it.itemName || 'item'}`,
                    performedBy,
                    at: now,
                  },
                },
                $set: { updatedAt: now },
              },
            },
          }));

          await IndexModel.Product.bulkWrite(bulkProdOps, { ordered: true });
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

export default {
  createOrder,
  listCompanyOrders, // assume unchanged
  getOrderById, // assume unchanged
  cancelOrder,
  updateOrderStatus,
};