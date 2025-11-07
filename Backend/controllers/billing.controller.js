import IndexModel from '../models/indexModel.js';
import { generateBillNumber } from '../utils/generateBillNumber.js';
import mongoose from 'mongoose';
import sanitize from 'sanitize-html';

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return sanitize(input, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  }
  return input;
};

const createBill = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const {
      orderId, // ✅ SINGLE order id (required now)
      buyer,
      taxPercent: providedTaxPercent,
      notes = '',
      paymentMethod,
      paymentNumber,
    } = req.body ?? {};

    // ---- 1) top-level validations ----
    if (!mongoose.isValidObjectId(orderId)) {
      throw new Error('A valid orderId is required');
    }

    if (!['cash', 'credit_card', 'bank_transfer'].includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }

    const sanitizedNotes = sanitizeInput(notes);
    if (
      sanitizedNotes &&
      (typeof sanitizedNotes !== 'string' ||
        sanitizedNotes.length > 1000 ||
        !/^[\w\s.,!?-]*$/.test(sanitizedNotes))
    ) {
      throw new Error('Invalid notes format or length');
    }

    // Non-cash needs paymentNumber (and typically buyer details)
    if (
      ['credit_card', 'bank_transfer'].includes(paymentMethod) &&
      !paymentNumber?.trim()
    ) {
      throw new Error('Payment number is required for non-cash payments');
    }

    // ---- 2) company + tax ----
    const company = await IndexModel.Company.findOne({
      companyId,
      deleted: false,
      isActive: true,
    }).lean();

    if (!company) throw new Error('Company not found');

    const taxRates = {
      taxRateCash: company?.invoiceSettings?.tax?.taxRateCash || 0,
      taxRateCard: company?.invoiceSettings?.tax?.taxRateCard || 0,
    };

    let taxPercent =
      paymentMethod === 'cash' ? taxRates.taxRateCash : taxRates.taxRateCard;

    if (providedTaxPercent !== undefined) {
      if (typeof providedTaxPercent !== 'number' || providedTaxPercent < 0) {
        throw new Error('Provided taxPercent must be a number ≥ 0');
      }
      const must =
        paymentMethod === 'cash' ? taxRates.taxRateCash : taxRates.taxRateCard;
      if (providedTaxPercent !== must) {
        throw new Error(
          'Provided taxPercent does not match company tax settings'
        );
      }
      taxPercent = providedTaxPercent;
    }

    // ---- 3) fetch the order (one) ----
    const order = await IndexModel.Orders.findOne({
      _id: orderId,
      companyId,
      deleted: false,
    })
      .select(
        '_id orderNo items subTotal dynamicAttributes customerName customerPhone paymentStatus orderStatus'
      )
      .lean();

    if (!order) throw new Error('Order not found');

    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new Error('Selected order has no items to bill');
    }

    // ---- 4) map order.items -> bill.items (ProductId + OrderItemId) ----
    const billItems = order.items.map((it) => {
      const qty = Number.isFinite(it?.qty)
        ? Number(it.qty)
        : Number.isFinite(it?.quantity)
        ? Number(it.quantity)
        : 1;

      const price = Number.isFinite(it?.price) ? Number(it.price) : 0;

      // total fallback: prefer existing total, else qty*price
      const total = Number.isFinite(it?.total) ? Number(it.total) : qty * price;

      return {
        ProductId: it.productId
          ? new mongoose.Types.ObjectId(it.productId)
          : undefined, // if productId is stored as ObjectId string
        OrderItemId: it._id, // ✅ store the subdoc _id here
        dynamicAttributes: it.dynamicAttributes || {},
        itemName: it.name || 'Item',
        quantity: qty,
        price,
        total,
      };
    });

    // if any item has missing ProductId and you want to enforce it:
    // if (billItems.some(li => !li.ProductId)) {
    //   throw new Error('Each item must have a valid ProductId');
    // }

    // ---- 5) totals ----
    const subtotal = billItems.reduce(
      (s, li) => s + (Number(li.total) || 0),
      0
    );
    const taxAmount = +((subtotal * (Number(taxPercent) || 0)) / 100).toFixed(
      2
    );
    const total = +(subtotal + taxAmount).toFixed(2);

    // ---- 6) create bill (single OrderId on bill) ----
    const billNumber = await generateBillNumber(companyId);

    const bill = new IndexModel.Bill({
      billNumber,
      companyId,
      createdBy: userId,
      OrderId: order._id, // ✅ top-level OrderId
      items: billItems, // ✅ lines with ProductId + OrderItemId
      buyer: {
        name: sanitizeInput(buyer?.name) || '',
        email: sanitizeInput(buyer?.email) || '',
        phone: sanitizeInput(buyer?.phone) || '',
      },
      subtotal,
      taxPercent,
      taxAmount,
      total,
      paymentMethod,
      paymentNumber: paymentNumber ? sanitizeInput(paymentNumber) : '',
      notes: sanitizedNotes,
      history: [
        {
          action: 'create',
          performedBy: userId || 'system',
          createdAt: new Date(),
          notes: `Bill created from order ${order.orderNo || order._id}`,
        },
      ],
    });

    await bill.save();

    // ---- 7) update order payment/status ----
    // Your Order.paymentStatus enum: ['unpaid','partial','paid']
    // Rule: if bill was cash, mark order as 'paid', else keep current status (or set to 'unpaid')
    const nextPaymentStatus =
      paymentMethod === 'cash' ? 'paid' : order.paymentStatus || 'unpaid';

    await IndexModel.Orders.updateOne(
      { _id: order._id, companyId },
      {
        $set: {
          paymentStatus: nextPaymentStatus,
          orderStatus: 'completed',
          updatedBy: userId,
          updatedAt: new Date(),
        },
        $push: {
          history: {
            action: 'billed',
            performedBy: userId || 'system',
            createdAt: new Date(),
            notes: `Billed on ${billNumber}`,
          },
        },
      }
    );

    // ---- 8) Dine-In: flip occupied tables -> assigned (optional rule you had) ----
    try {
      const isDineIn =
        String(order?.dynamicAttributes?.orderType || '')
          .toLowerCase()
          .replace(/\s+/g, '-') === 'dine-in';

      const tableId = order?.dynamicAttributes?.tableNo;
      if (isDineIn && tableId && mongoose.isValidObjectId(String(tableId))) {
        await IndexModel.Table.updateOne(
          {
            _id: String(tableId),
            companyId,
            deleted: { $ne: true },
            state: 'occupied',
          },
          {
            $set: {
              state: 'available',
              updatedBy: userId,
              updatedAt: new Date(),
            },
          }
        );
      }
    } catch (e) {
      console.warn('Table state sync after billing failed:', e?.message || e);
    }

    return res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill.toObject(),
    });
  } catch (error) {
    console.error('Error creating bill:', error.message, error.stack);
    return res.status(400).json({
      success: false,
      message: 'Error creating bill',
      error: error.message,
    });
  }
};

const getBills = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [bills, total] = await Promise.all([
      IndexModel.Bill.find({
        companyId,
        deleted: false,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      IndexModel.Bill.countDocuments({
        companyId,
        deleted: false,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: bills,
      pagination: {
        page: pageNum,
        totalPages,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message,
    });
  }
};

const getBillById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill ID',
      });
    }

    const bill = await IndexModel.Bill.findOne({
      _id: id,
      companyId,
      deleted: false,
    }).lean();

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found or does not belong to the company',
      });
    }

    return res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message,
    });
  }
};
// controllers/billing.controller.js

const updateItemStatus = async (req, res) => {
  try {
    const { userId, companyId } = req.user || {};
    const { billId } = req.params;
    const { refundItems = [], notes = '' } = req.body || {};

    if (!mongoose.isValidObjectId(billId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid bill ID' });
    }
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!Array.isArray(refundItems) || refundItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Nothing to refund' });
    }

    const bill = await IndexModel.Bill.findOne({
      _id: billId,
      companyId,
      deleted: false,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found or does not belong to the company',
      });
    }

    const sanitizedNotes = sanitizeInput(notes);
    if (
      sanitizedNotes &&
      (typeof sanitizedNotes !== 'string' || sanitizedNotes.length > 1000)
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid notes format or length' });
    }

    const n = (v) => Number(v || 0);
    const now = new Date();

    const pushHistory = (action, note = '') => {
      bill.history = bill.history || [];
      bill.history.push({
        action,
        performedBy: userId,
        notes: note.trim() || undefined,
        createdAt: now,
      });
    };

    let deltaRefundAmount = 0;
    const refundedItems = [];
    const ordersTouched = new Map();

    // orderId -> { deltaAmount, items:[...] }

    // ——— Recompute totals by subtracting per-line refund amounts (handles partials)
    const recomputeBillTotals = () => {
      const subtotal = bill.items.reduce((sum, it) => {
        if (['cancelled', 'returned_accept'].includes(it.status)) return sum;
        const lineTotalAfterRefund = Math.max(
          0,
          n(it.total) - n(it.refundAmount)
        );
        return sum + lineTotalAfterRefund;
      }, 0);
      bill.subtotal = +subtotal.toFixed(2);
      bill.taxAmount = +(bill.subtotal * (n(bill.taxPercent) / 100)).toFixed(2);
      bill.total = +(bill.subtotal + bill.taxAmount).toFixed(2);
    };

    // Normalize a few possible bill locations for order id
    const billOrderId =
      bill?.buyer?.OrderId || // you showed this exact casing in your sample
      bill?.buyer?.orderId ||
      bill?.meta?.orderId ||
      null;

    // ---- Process each refund line
    for (const refundItem of refundItems) {
      const productId = refundItem?.productId;
      const orderItemId = refundItem?.orderItemId;
      const sku = String(refundItem?.sku || '').trim();
      const quantityReq = Number(refundItem?.quantity || 0);

      if (
        (!productId && !orderItemId && !sku) ||
        !Number.isInteger(quantityReq) ||
        quantityReq <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Each refund item needs productId or orderItemId or sku, and a positive integer quantity',
        });
      }

      // Find the bill item by productId -> orderItemId -> sku
      const billItem = bill.items.find((it) => {
        const byProd =
          productId &&
          String(it.productId || it.ProductId) === String(productId);
        const byOrderItem =
          orderItemId &&
          String(it.orderItemId || it.OrderItemId) === String(orderItemId);
        const bySku = sku && String(it.sku) === sku;
        return !!(byProd || byOrderItem || bySku);
      });

      if (!billItem) {
        return res.status(400).json({
          success: false,
          message:
            'Refund target not found in this bill (productId/orderItemId/sku mismatch)',
        });
      }

      const originalQty = Number(billItem.quantity ?? billItem.qty ?? 0);
      const alreadyRefunded =
        (billItem.refundHistory || []).reduce(
          (sum, r) => sum + n(r.refundQuantity),
          0
        ) || 0;
      const remainingQty = Math.max(0, originalQty - alreadyRefunded);

      if (quantityReq > remainingQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot refund ${quantityReq} units of this item: only ${remainingQty} available`,
        });
      }

      // Resolve Product for restock: prefer explicit refundItem.productId; else bill item; else by SKU
      let productDoc = null;
      const candidateProductId =
        productId || billItem.productId || billItem.ProductId || null;
      if (candidateProductId && mongoose.isValidObjectId(candidateProductId)) {
        productDoc = await IndexModel.Product.findOne({
          _id: candidateProductId,
          companyId,
          deleted: false,
        });
      } else if (!candidateProductId && billItem.sku) {
        productDoc = await IndexModel.Product.findOne({
          SKU: billItem.sku,
          companyId,
          deleted: false,
        });
      }

      // Best-effort restock
      if (productDoc) {
        await IndexModel.Product.updateOne(
          { _id: productDoc._id },
          {
            $inc: { quantity: quantityReq, totalReturned: quantityReq },
            $push: {
              history: {
                action: `Refund: ${quantityReq} unit(s) returned from bill ${
                  bill.billNumber || bill._id
                }`,
                performedBy: userId,
                at: now,
              },
            },
          }
        );
      }

      // Money math for this line
      const unitPrice = n(billItem.price);
      const lineDelta = unitPrice * quantityReq;
      deltaRefundAmount += lineDelta;

      // Update bill line
      const newRefundEntry = {
        refundQuantity: quantityReq,
        refundAmount: lineDelta,
        refundReason: sanitizeInput(refundItem.reason) || 'Partial refund',
        refundedBy: userId,
        refundedAt: now,
      };

      billItem.refundHistory = Array.isArray(billItem.refundHistory)
        ? billItem.refundHistory
        : [];
      billItem.refundHistory.push(newRefundEntry);
      billItem.refundAmount = n(billItem.refundAmount) + lineDelta;

      const totalRefundedQtyForLine = billItem.refundHistory.reduce(
        (s, r) => s + n(r.refundQuantity),
        0
      );

      // Per-item refund status
      billItem.status =
        totalRefundedQtyForLine >= originalQty
          ? 'refund_full'
          : 'refund_partial';
      if (billItem.status === 'returned_accept') {
        billItem.total = 0;
      } else {
        billItem.total = Math.max(0, n(billItem.total) - lineDelta);
      }

      refundedItems.push({
        productId: String(billItem.productId || billItem.ProductId || ''),
        orderItemId: String(billItem.orderItemId || billItem.OrderItemId || ''),
        sku: billItem.sku,
        itemName: billItem.itemName,
        quantity: quantityReq,
        refundAmount: lineDelta,
        status: billItem.status,
      });

      // Optional order sync bucket
      const orderId =
        billItem.orderId ||
        billItem.OrderId ||
        billOrderId ||
        bill?.meta?.orderId ||
        null;

      if (orderId) {
        const key = String(orderId);
        if (!ordersTouched.has(key))
          ordersTouched.set(key, { deltaAmount: 0, items: [] });
        const bucket = ordersTouched.get(key);
        bucket.deltaAmount += lineDelta;
        bucket.items.push({
          orderItemId: String(
            billItem.orderItemId || billItem.OrderItemId || ''
          ),
          productId: String(billItem.productId || billItem.ProductId || ''),
          sku: billItem.sku,
          qty: quantityReq,
          amount: lineDelta,
          price: unitPrice,
        });
      }
    }

    // Recompute bill totals and overall status
    recomputeBillTotals();

    const prevTotalRefund = n(bill?.refundDetails?.totalRefundAmount);
    const cumulativeRefund = prevTotalRefund + deltaRefundAmount;

    const allFullyRefunded = bill.items.every(
      (it) => it.status === 'refund_full' || it.status === 'cancelled'
    );
    bill.status = allFullyRefunded ? 'refunded' : 'partially_refunded';

    bill.refundDetails = {
      ...(bill.refundDetails || {}),
      totalRefundAmount: cumulativeRefund,
      refundedAt: now,
      refundedBy: userId,
      refundReason:
        sanitizedNotes ||
        (allFullyRefunded ? 'Full refund (all items)' : 'Partial refund'),
    };

    pushHistory(
      `Bill ${bill.status} – this operation refund: ${deltaRefundAmount.toFixed(
        2
      )}`,
      sanitizedNotes
    );

    await bill.save();

    // ---- OPTIONAL: sync to Orders (no session)
    if (ordersTouched.size > 0) {
      for (const [orderId, info] of ordersTouched.entries()) {
        const order = await IndexModel.Orders.findOne({
          _id: orderId,
          companyId,
          deleted: { $ne: true },
        });
        if (!order) continue;

        for (const it of info.items) {
          const target = order.items.find((oi) => {
            const byOrderItem =
              it.orderItemId &&
              String(oi.orderItemId || oi.OrderItemId) ===
                String(it.orderItemId);
            const byProduct =
              !byOrderItem &&
              it.productId &&
              String(oi.productId) === String(it.productId);
            const bySku =
              !byOrderItem &&
              !byProduct &&
              it.sku &&
              String(oi.sku) === String(it.sku);
            return !!(byOrderItem || byProduct || bySku);
          });

          if (target) {
            target.refundHistory = Array.isArray(target.refundHistory)
              ? target.refundHistory
              : [];
            target.refundHistory.push({
              refundQuantity: it.qty,
              refundAmount: it.amount,
              at: now,
              by: userId,
              via: 'bill_refund',
            });
            const origQty = Number(target.quantity ?? target.qty ?? 0);
            const sumRef = target.refundHistory.reduce(
              (s, r) => s + n(r.refundQuantity),
              0
            );
            target.status = sumRef >= origQty ? 'refunded' : 'partial';
          }
        }

        order.refundTotal = n(order.refundTotal) + n(info.deltaAmount);
        order.paidAmount = Math.max(
          0,
          n(order.paidAmount) - n(info.deltaAmount)
        );

        const orderTotal = n(order.total || order.subTotal || 0);
        if (order.paidAmount === 0) order.paymentStatus = 'refunded';
        else if (order.paidAmount < orderTotal) order.paymentStatus = 'partial';
        else order.paymentStatus = 'paid';

        await order.save();
      }
    }

    const refundStatus =
      bill.status === 'refunded' ? 'Refunded' : 'Partial Refunded';
    await IndexModel.Orders.updateOne(
      { _id: bill.OrderId, companyId },
      {
        $set: {
          paymentStatus: refundStatus,

          updatedBy: userId,
          updatedAt: new Date(),
        },
        $push: {
          history: {
            action: 'refunded',
            performedBy: userId || 'system',
            createdAt: new Date(),
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: `Bill successfully ${bill.status}`,
      data: {
        bill: bill.toObject(),
        refundedItems,
        deltaRefundAmount,
        cumulativeRefundAmount: bill.refundDetails.totalRefundAmount,
      },
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(400).json({
      success: false,
      message: 'Error processing refund',
      error: error.message,
    });
  }
};

const deleteBill = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { billId } = req.params;

    if (!mongoose.isValidObjectId(billId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill ID',
      });
    }

    const bill = await IndexModel.Bill.findOne({
      _id: billId,
      companyId,
      deleted: false,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found or does not belong to the company',
      });
    }

    for (const item of bill.items) {
      if (item.status !== 'returned_accept' && item.status !== 'cancelled') {
        const product = await IndexModel.Product.findOne({
          _id: item.productId,
          companyId,
          deleted: false,
        });

        if (product) {
          const result = await IndexModel.Product.updateOne(
            { _id: item.productId },
            {
              $inc: {
                quantity: item.quantity,
                totalOrdered: -item.quantity,
              },
              $push: {
                history: {
                  action: `Bill Deleted: ${item.quantity} units of ${item.sku} returned to product (Bill ${bill.billNumber})`,
                  performedBy: userId,
                },
              },
            }
          );

          if (result.modifiedCount === 0) {
            throw new Error(`Failed to update product for ${item.sku}`);
          }
        }
      }
    }

    bill.deleted = true;
    bill.deletedAt = new Date();
    bill.subtotal = 0;
    bill.taxAmount = 0;
    bill.total = 0;

    bill.items.forEach((item) => {
      item.total = 0;
      item.refundAmount = 0;
      if (item.status !== 'returned_accept') {
        item.status = 'cancelled';
      }
    });

    bill.history.push({
      action: 'Bill deleted and all items returned to product',
      performedBy: userId,
      createdAt: new Date(),
    });

    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'Bill deleted successfully and all items returned to product',
      data: {
        billNumber: bill.billNumber,
        deletedAt: bill.deletedAt,
      },
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return res.status(400).json({
      success: false,
      message: 'Error deleting bill',
      error: error.message,
    });
  }
};

export default {
  createBill,
  getBills,
  getBillById,
  updateItemStatus,
  deleteBill,
};
