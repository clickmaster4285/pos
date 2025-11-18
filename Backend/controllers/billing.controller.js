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
      orderId,
      items: rawItems,
      buyer,
      taxPercent: providedTaxPercent,
      discountPercent: providedDiscountPercent,
      notes = '',
      paymentMethod,
      paymentNumber,
    } = req.body ?? {};

    // === 1. Basic Validation ===
    if (!['cash', 'credit_card', 'bank_transfer'].includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }
    if (['credit_card', 'bank_transfer'].includes(paymentMethod) && !paymentNumber?.trim()) {
      throw new Error('Payment number is required for non-cash payments');
    }

    const sanitizedNotes = sanitizeInput(notes);
    if (sanitizedNotes?.length > 1000) throw new Error('Notes too long');

    const hasOrderId = orderId && mongoose.isValidObjectId(String(orderId));

    // === 2. Company & Tax Settings ===
    const company = await IndexModel.Company.findOne({ 
      companyId: companyId, deleted: false, isActive: true 
    }).lean();
    if (!company) throw new Error('Company not found');

    const taxRateCash = company?.invoiceSettings?.tax?.taxRateCash || 0;
    const taxRateCard = company?.invoiceSettings?.tax?.taxRateCard || 0;
    const taxPercent = paymentMethod === 'cash' ? taxRateCash : taxRateCard;

    if (providedTaxPercent !== undefined && providedTaxPercent !== taxPercent) {
      throw new Error('Provided tax percent does not match company settings');
    }

    // === 3. Build Bill Items ===
    let billItems = [];

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      billItems = rawItems.map(it => ({
        ProductId: it.productId ? new mongoose.Types.ObjectId(String(it.productId)) : undefined,
        OrderItemId: it.orderItemId ? new mongoose.Types.ObjectId(String(it.orderItemId)) : undefined,
        dynamicAttributes: it.dynamicAttributes || {},
        itemName: sanitizeInput(it.itemName || it.name || 'Item'),
        quantity: Math.max(1, Math.floor(Number(it.qty || it.quantity || 1))),
        price: Number(it.price || 0),
        total: Number(it.lineTotal || it.total || (it.qty || 1) * (it.price || 0)),
      }));
    } else if (hasOrderId) {
      const order = await IndexModel.Orders.findOne({ 
        _id: orderId, companyId, deleted: false 
      }).select('items subTotal').lean();

      if (!order) throw new Error('Order not found');

      billItems = order.items.map(it => ({
        ProductId: it.productId ? new mongoose.Types.ObjectId(String(it.productId)) : undefined,
        OrderItemId: it._id,
        dynamicAttributes: it.dynamicAttributes || {},
        itemName: it.name || 'Item',
        quantity: Number(it.qty || 1),
        price: Number(it.price || 0),
        total: Number(it.total || 0),
      }));
    } else {
      throw new Error('No items provided');
    }

    if (billItems.length === 0) throw new Error('Bill must have at least one item');

    // === 4. Calculate Totals ===
    const subtotal = billItems.reduce((sum, li) => sum + Number(li.total), 0);
    const discountPercent = Math.max(0, Math.min(100, Number(providedDiscountPercent || 0)));
    const discountAmount = Number((subtotal * (discountPercent / 100)).toFixed(2));
    const taxableBase = subtotal - discountAmount;
    const taxAmount = Number((taxableBase * (taxPercent / 100)).toFixed(2));
    const total = Number((taxableBase + taxAmount).toFixed(2));

    const billNumber = await generateBillNumber(companyId);
    const now = new Date();

    // === 5. YOUR WORKING & PERFECT INGREDIENT + STOCK DEDUCTION ===
    const productOnlyLines = billItems.filter(li => li.ProductId && !li.OrderItemId);

    if (productOnlyLines.length > 0) {
      const productIds = [...new Set(productOnlyLines.map(li => li.ProductId.toString()))];

      const products = await IndexModel.Product.find({
        _id: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) },
        companyId,
        deleted: false,
        isActive: true
      })
      .populate({
        path: 'ingredient.ingredientId',
        select: 'name currentStock unit companyId'
      })
      .lean();

      const productMap = new Map(products.map(p => [p._id.toString(), p]));

      const neededByProduct = productOnlyLines.reduce((acc, li) => {
        const pid = li.ProductId.toString();
        acc[pid] = (acc[pid] || 0) + li.quantity;
        return acc;
      }, {});

      const ingredientBulkOps = [];
      const productBulkOps = [];

      for (const [pid, neededQty] of Object.entries(neededByProduct)) {
        const product = productMap.get(pid);
        if (!product) throw new Error(`Product not found: ${pid}`);

        const ingredients = product.ingredient || [];

        if (ingredients.length > 0) {
          // RECIPE PRODUCT → DEDUCT INGREDIENTS ONLY
          for (const ing of ingredients) {
            const ingredient = ing.ingredientId;
            if (!ingredient) continue;

            const qtyPerUnit = Number(ing.quantity) || 1;
            const requiredQty = neededQty * qtyPerUnit;

            if (ingredient.currentStock < requiredQty) {
              throw new Error(`Low stock: ${ingredient.name} (Need ${requiredQty}, Have ${ingredient.currentStock})`);
            }

            ingredientBulkOps.push({
              updateOne: {
                filter: { _id: ingredient._id, companyId },
                update: {
                  $inc: { currentStock: -requiredQty },
                  $push: {
                    history: {
                      action: 'USED_IN_BILL',
                      performedBy: userId,
                      details: `-${requiredQty} ${ing.unit || ''} → ${neededQty}× ${product.productName} (Bill #${billNumber})`,
                      timestamp: now
                    }
                  }
                }
              }
            });
          }

          // Track sale in product (no quantity change)
          productBulkOps.push({
            updateOne: {
              filter: { _id: pid, companyId },
              update: {
                $inc: { totalOrdered: neededQty },
                $push: {
                  history: {
                    action: 'SOLD_VIA_RECIPE',
                    performedBy: userId,
                    details: `Recipe sale: ${neededQty} units (Bill #${billNumber})`,
                    timestamp: now
                  }
                }
              }
            }
          });

        } else {
          // SIMPLE PRODUCT → DEDUCT PRODUCT STOCK
          if ((product.quantity || 0) < neededQty) {
            throw new Error(`Out of stock: ${product.productName} (Need ${neededQty}, Have ${product.quantity || 0})`);
          }

          productBulkOps.push({
            updateOne: {
              filter: { _id: pid, companyId },
              update: {
                $inc: { quantity: -neededQty, totalOrdered: neededQty },
                $push: {
                  history: {
                    action: 'SOLD_DIRECT',
                    performedBy: userId,
                    details: `${neededQty} units sold (Bill #${billNumber})`,
                    timestamp: now
                  }
                }
              }
            }
          });
        }
      }

      // Execute all stock updates
      if (ingredientBulkOps.length > 0) {
        await IndexModel.Ingredient.bulkWrite(ingredientBulkOps, { ordered: false });
      }
      if (productBulkOps.length > 0) {
        await IndexModel.Product.bulkWrite(productBulkOps, { ordered: false });
      }
    }

    // === 6. CREATE BILL ===
    const bill = await IndexModel.Bill.create({
      billNumber,
      companyId,
      createdBy: userId,
      OrderId: hasOrderId ? orderId : null,
      items: billItems,
      buyer: buyer ? {
        name: sanitizeInput(buyer.name),
        email: sanitizeInput(buyer.email),
        phone: sanitizeInput(buyer.phone),
      } : undefined,
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      total,
      paymentMethod,
      paymentNumber: paymentMethod !== 'cash' ? sanitizeInput(paymentNumber) : undefined,
      notes: sanitizedNotes,
      status: 'paid',
      history: [{
        action: 'CREATED',
        performedBy: userId,
        notes: hasOrderId ? 'Bill from order' : 'Direct bill',
        createdAt: now,
      }],
    });

    // === 7. UPDATE ORDER STATUS & AUTO FREE TABLE (FULLY RESTORED!) ===
    if (hasOrderId) {
      const order = await IndexModel.Orders.findOne({ _id: orderId, companyId }).lean();
      if (order) {
        const previousPaid = Number(order.paidAmount || 0);
        const orderTotal = Number(order.subTotal || 0);
        const newPaid = previousPaid + total;
        const isFullyPaid = newPaid >= orderTotal - 0.01;

        await IndexModel.Orders.updateOne(
          { _id: orderId },
          {
            $inc: { paidAmount: total },
            $set: { paymentStatus: isFullyPaid ? 'paid' : 'partial' },
            $push: {
              history: {
                action: 'PAYMENT',
                performedBy: userId,
                createdAt: now,
                notes: `Paid ${total} via Bill #${billNumber}`
              }
            }
          }
        );

        // AUTO FREE TABLE WHEN FULLY PAID & DINE-IN
        const orderType = (order.dynamicAttributes?.orderType || '').toLowerCase();
        const tableId = order.dynamicAttributes?.tableNo || order.dynamicAttributes?.tableId;

        if (
          isFullyPaid &&
          orderType.includes('dine') &&
          tableId &&
          mongoose.Types.ObjectId.isValid(tableId)
        ) {
          await IndexModel.Table.updateOne(
            { _id: tableId, companyId, deleted: { $ne: true } },
            {
              $set: {
                state: 'available',
                assignedWaiterId: null,
                updatedBy: userId,
                updatedAt: new Date()
              }
            }
          );

          console.log(`Table ${tableId} automatically freed - Order fully paid (Bill #${billNumber})`);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: { bill }
    });

  } catch (error) {
    console.error('Create bill error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create bill'
    });
  }
};


const getBills = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Base filter for company
    const filter = { companyId, deleted: false };

    if (role !== 'admin') {
      filter.createdBy = userId;
    }

    const [bills, total] = await Promise.all([
      IndexModel.Bill.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      IndexModel.Bill.countDocuments(filter),
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

// const updateItemStatus = async (req, res) => {
//   try {
//     const { userId, companyId } = req.user || {};
//     const { billId } = req.params;
//     const { refundItems = [], notes = '' } = req.body || {};

//     if (!mongoose.isValidObjectId(billId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Invalid bill ID' });
//     }
//     if (!companyId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }
//     if (!Array.isArray(refundItems) || refundItems.length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Nothing to refund' });
//     }

//     const bill = await IndexModel.Bill.findOne({
//       _id: billId,
//       companyId,
//       deleted: false,
//     });

//     if (!bill) {
//       return res.status(404).json({
//         success: false,
//         message: 'Bill not found or does not belong to the company',
//       });
//     }

//     const sanitizedNotes = sanitizeInput(notes);
//     if (
//       sanitizedNotes &&
//       (typeof sanitizedNotes !== 'string' || sanitizedNotes.length > 1000)
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Invalid notes format or length' });
//     }

//     const n = (v) => Number(v || 0);
//     const now = new Date();

//     const pushHistory = (action, note = '') => {
//       bill.history = bill.history || [];
//       bill.history.push({
//         action,
//         performedBy: userId,
//         notes: note.trim() || undefined,
//         createdAt: now,
//       });
//     };

//     let deltaRefundAmount = 0;
//     const refundedItems = [];
//     const ordersTouched = new Map();

//     // orderId -> { deltaAmount, items:[...] }

//     // ——— Recompute totals by subtracting per-line refund amounts (handles partials)
//     const recomputeBillTotals = () => {
//       const subtotal = bill.items.reduce((sum, it) => {
//         if (['cancelled', 'returned_accept'].includes(it.status)) return sum;
//         const lineTotalAfterRefund = Math.max(
//           0,
//           n(it.total) - n(it.refundAmount)
//         );
//         return sum + lineTotalAfterRefund;
//       }, 0);
//       bill.subtotal = +subtotal.toFixed(2);
//       bill.taxAmount = +(bill.subtotal * (n(bill.taxPercent) / 100)).toFixed(2);
//       bill.total = +(bill.subtotal + bill.taxAmount).toFixed(2);
//     };

//     // Normalize a few possible bill locations for order id
//     const billOrderId =
//       bill?.buyer?.OrderId || // you showed this exact casing in your sample
//       bill?.buyer?.orderId ||
//       bill?.meta?.orderId ||
//       null;

//     // ---- Process each refund line
//     for (const refundItem of refundItems) {
//       const productId = refundItem?.productId;
//       const orderItemId = refundItem?.orderItemId;
//       const sku = String(refundItem?.sku || '').trim();
//       const quantityReq = Number(refundItem?.quantity || 0);

//       if (
//         (!productId && !orderItemId && !sku) ||
//         !Number.isInteger(quantityReq) ||
//         quantityReq <= 0
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             'Each refund item needs productId or orderItemId or sku, and a positive integer quantity',
//         });
//       }

//       // Find the bill item by productId -> orderItemId -> sku
//       const billItem = bill.items.find((it) => {
//         const byProd =
//           productId &&
//           String(it.productId || it.ProductId) === String(productId);
//         const byOrderItem =
//           orderItemId &&
//           String(it.orderItemId || it.OrderItemId) === String(orderItemId);
//         const bySku = sku && String(it.sku) === sku;
//         return !!(byProd || byOrderItem || bySku);
//       });

//       if (!billItem) {
//         return res.status(400).json({
//           success: false,
//           message:
//             'Refund target not found in this bill (productId/orderItemId/sku mismatch)',
//         });
//       }

//       const originalQty = Number(billItem.quantity ?? billItem.qty ?? 0);
//       const alreadyRefunded =
//         (billItem.refundHistory || []).reduce(
//           (sum, r) => sum + n(r.refundQuantity),
//           0
//         ) || 0;
//       const remainingQty = Math.max(0, originalQty - alreadyRefunded);

//       if (quantityReq > remainingQty) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot refund ${quantityReq} units of this item: only ${remainingQty} available`,
//         });
//       }

//       // Resolve Product for restock: prefer explicit refundItem.productId; else bill item; else by SKU
//       let productDoc = null;
//       const candidateProductId =
//         productId || billItem.productId || billItem.ProductId || null;
//       if (candidateProductId && mongoose.isValidObjectId(candidateProductId)) {
//         productDoc = await IndexModel.Product.findOne({
//           _id: candidateProductId,
//           companyId,
//           deleted: false,
//         });
//       } else if (!candidateProductId && billItem.sku) {
//         productDoc = await IndexModel.Product.findOne({
//           SKU: billItem.sku,
//           companyId,
//           deleted: false,
//         });
//       }

//       // Best-effort restock
//       if (productDoc) {
//         await IndexModel.Product.updateOne(
//           { _id: productDoc._id },
//           {
//             $inc: { quantity: quantityReq, totalReturned: quantityReq },
//             $push: {
//               history: {
//                 action: `Refund: ${quantityReq} unit(s) returned from bill ${
//                   bill.billNumber || bill._id
//                 }`,
//                 performedBy: userId,
//                 at: now,
//               },
//             },
//           }
//         );
//       }

//       // Money math for this line
//       const unitPrice = n(billItem.price);
//       const lineDelta = unitPrice * quantityReq;
//       deltaRefundAmount += lineDelta;

//       // Update bill line
//       const newRefundEntry = {
//         refundQuantity: quantityReq,
//         refundAmount: lineDelta,
//         refundReason: sanitizeInput(refundItem.reason) || 'Partial refund',
//         refundedBy: userId,
//         refundedAt: now,
//       };

//       billItem.refundHistory = Array.isArray(billItem.refundHistory)
//         ? billItem.refundHistory
//         : [];
//       billItem.refundHistory.push(newRefundEntry);
//       billItem.refundAmount = n(billItem.refundAmount) + lineDelta;

//       const totalRefundedQtyForLine = billItem.refundHistory.reduce(
//         (s, r) => s + n(r.refundQuantity),
//         0
//       );

//       // Per-item refund status
//       billItem.status =
//         totalRefundedQtyForLine >= originalQty
//           ? 'refund_full'
//           : 'refund_partial';
//       if (billItem.status === 'returned_accept') {
//         billItem.total = 0;
//       } else {
//         billItem.total = Math.max(0, n(billItem.total) - lineDelta);
//       }

//       refundedItems.push({
//         productId: String(billItem.productId || billItem.ProductId || ''),
//         orderItemId: String(billItem.orderItemId || billItem.OrderItemId || ''),
//         sku: billItem.sku,
//         itemName: billItem.itemName,
//         quantity: quantityReq,
//         refundAmount: lineDelta,
//         status: billItem.status,
//       });

//       // Optional order sync bucket
//       const orderId =
//         billItem.orderId ||
//         billItem.OrderId ||
//         billOrderId ||
//         bill?.meta?.orderId ||
//         null;

//       if (orderId) {
//         const key = String(orderId);
//         if (!ordersTouched.has(key))
//           ordersTouched.set(key, { deltaAmount: 0, items: [] });
//         const bucket = ordersTouched.get(key);
//         bucket.deltaAmount += lineDelta;
//         bucket.items.push({
//           orderItemId: String(
//             billItem.orderItemId || billItem.OrderItemId || ''
//           ),
//           productId: String(billItem.productId || billItem.ProductId || ''),
//           sku: billItem.sku,
//           qty: quantityReq,
//           amount: lineDelta,
//           price: unitPrice,
//         });
//       }
//     }

//     // Recompute bill totals and overall status
//     recomputeBillTotals();

//     const prevTotalRefund = n(bill?.refundDetails?.totalRefundAmount);
//     const cumulativeRefund = prevTotalRefund + deltaRefundAmount;

//     const allFullyRefunded = bill.items.every(
//       (it) => it.status === 'refund_full' || it.status === 'cancelled'
//     );
//     bill.status = allFullyRefunded ? 'refunded' : 'partially_refunded';

//     bill.refundDetails = {
//       ...(bill.refundDetails || {}),
//       totalRefundAmount: cumulativeRefund,
//       refundedAt: now,
//       refundedBy: userId,
//       refundReason:
//         sanitizedNotes ||
//         (allFullyRefunded ? 'Full refund (all items)' : 'Partial refund'),
//     };

//     pushHistory(
//       `Bill ${bill.status} – this operation refund: ${deltaRefundAmount.toFixed(
//         2
//       )}`,
//       sanitizedNotes
//     );

//     await bill.save();

//     // ---- OPTIONAL: sync to Orders (no session)
//     if (ordersTouched.size > 0) {
//       for (const [orderId, info] of ordersTouched.entries()) {
//         const order = await IndexModel.Orders.findOne({
//           _id: orderId,
//           companyId,
//           deleted: { $ne: true },
//         });
//         if (!order) continue;

//         for (const it of info.items) {
//           const target = order.items.find((oi) => {
//             const byOrderItem =
//               it.orderItemId &&
//               String(oi.orderItemId || oi.OrderItemId) ===
//                 String(it.orderItemId);
//             const byProduct =
//               !byOrderItem &&
//               it.productId &&
//               String(oi.productId) === String(it.productId);
//             const bySku =
//               !byOrderItem &&
//               !byProduct &&
//               it.sku &&
//               String(oi.sku) === String(it.sku);
//             return !!(byOrderItem || byProduct || bySku);
//           });

//           if (target) {
//             target.refundHistory = Array.isArray(target.refundHistory)
//               ? target.refundHistory
//               : [];
//             target.refundHistory.push({
//               refundQuantity: it.qty,
//               refundAmount: it.amount,
//               at: now,
//               by: userId,
//               via: 'bill_refund',
//             });
//             const origQty = Number(target.quantity ?? target.qty ?? 0);
//             const sumRef = target.refundHistory.reduce(
//               (s, r) => s + n(r.refundQuantity),
//               0
//             );
//             target.status = sumRef >= origQty ? 'refunded' : 'partial';
//           }
//         }

//         order.refundTotal = n(order.refundTotal) + n(info.deltaAmount);
//         order.paidAmount = Math.max(
//           0,
//           n(order.paidAmount) - n(info.deltaAmount)
//         );

//         const orderTotal = n(order.total || order.subTotal || 0);
//         if (order.paidAmount === 0) order.paymentStatus = 'refunded';
//         else if (order.paidAmount < orderTotal) order.paymentStatus = 'partial';
//         else order.paymentStatus = 'paid';

//         await order.save();
//       }
//     }

//     const refundStatus =
//       bill.status === 'refunded' ? 'Refunded' : 'Partial Refunded';
//     await IndexModel.Orders.updateOne(
//       { _id: bill.OrderId, companyId },
//       {
//         $set: {
//           paymentStatus: refundStatus,

//           updatedBy: userId,
//           updatedAt: new Date(),
//         },
//         $push: {
//           history: {
//             action: 'refunded',
//             performedBy: userId || 'system',
//             createdAt: new Date(),
//           },
//         },
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       message: `Bill successfully ${bill.status}`,
//       data: {
//         bill: bill.toObject(),
//         refundedItems,
//         deltaRefundAmount,
//         cumulativeRefundAmount: bill.refundDetails.totalRefundAmount,
//       },
//     });
//   } catch (error) {
//     console.error('Error processing refund:', error);
//     return res.status(400).json({
//       success: false,
//       message: 'Error processing refund',
//       error: error.message,
//     });
//   }
// };

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

    // --------- Helpers ---------

    // Match best bill line for this refund item (handles multiple same product lines)
    const findRefundLine = (bill, refundItem) => {
      const { productId, orderItemId } = refundItem;
      const sku = String(refundItem?.sku || '').trim();
      const quantityReq = Number(refundItem?.quantity || 0);

      // 1) filter candidates
      const candidates = (bill.items || []).filter((it) => {
        const byOrderItem =
          orderItemId &&
          String(it.orderItemId || it.OrderItemId) === String(orderItemId);
        const byProd =
          !orderItemId &&
          productId &&
          String(it.productId || it.ProductId) === String(productId);
        const bySku =
          !orderItemId && !productId && sku && String(it.sku) === sku;
        return byOrderItem || byProd || bySku;
      });

      if (!candidates.length) {
        return {
          error:
            'Refund target not found in this bill (productId/orderItemId/sku mismatch)',
        };
      }

      let chosen = null;
      let totalRemainingAcrossCandidates = 0;

      for (const it of candidates) {
        const orig = Number(it.quantity ?? it.qty ?? 0);
        const alreadyRefunded =
          (it.refundHistory || []).reduce(
            (sum, r) => sum + n(r.refundQuantity),
            0
          ) || 0;
        const remaining = Math.max(0, orig - alreadyRefunded);
        totalRemainingAcrossCandidates += remaining;

        if (!chosen && remaining >= quantityReq) {
          if (!orderItemId && productId) {
            if (!it.OrderItemId && !it.orderItemId) {
              chosen = it; // pure product line first
            } else {
              chosen = it;
            }
          } else {
            chosen = it;
          }
        }
      }

      if (!chosen) {
        return {
          error: `Cannot refund ${quantityReq} units of this item: only ${totalRemainingAcrossCandidates} available`,
        };
      }

      return { billItem: chosen };
    };

    // Recalculate bill totals according to your billing schema
    const recalcBillTotals = (bill) => {
      const subtotalFromItems = (bill.items || []).reduce((sum, it) => {
        const status = String(it.status || '').toLowerCase();

        // fully removed / refunded lines do not contribute
        if (['cancelled', 'returned_accept', 'refund_full'].includes(status)) {
          return sum;
        }

        // partial / returned_request -> total - refundAmount
        if (['returned_request', 'refund_partial'].includes(status)) {
          const afterRefund = Math.max(0, n(it.total) - n(it.refundAmount));
          return sum + afterRefund;
        }

        // normal line
        return sum + n(it.total);
      }, 0);

      bill.subtotal = +subtotalFromItems.toFixed(2);

      // discount percent clamp
      let dPct = n(bill.discountPercent);
      if (dPct < 0) dPct = 0;
      if (dPct > 100) dPct = 100;
      bill.discountPercent = dPct;

      const discountAmount = +(subtotalFromItems * (dPct / 100)).toFixed(2);
      bill.discountAmount = discountAmount;

      const taxableBase = subtotalFromItems - discountAmount;
      const taxAmount = +(taxableBase * (n(bill.taxPercent) / 100)).toFixed(2);
      const total = +(taxableBase + taxAmount).toFixed(2);

      bill.taxAmount = taxAmount;
      bill.total = total;
    };

    // --------- Main refund logic ---------

    let deltaRefundAmount = 0;
    const refundedItems = [];
    const ordersTouched = new Map(); // orderId -> { deltaAmount, items: [...] }

    // collect product restocks, apply to DB at the end
    // key: productId string -> { qty }
    const productRestockMap = new Map();

    // possible bill-level order id fallback
    const billOrderId =
      bill?.OrderId ||
      bill?.buyer?.OrderId ||
      bill?.buyer?.orderId ||
      bill?.meta?.orderId ||
      null;

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

      // find target bill line (smart matching)
      const { billItem, error } = findRefundLine(bill, {
        productId,
        orderItemId,
        sku,
        quantity: quantityReq,
      });

      if (error) {
        return res.status(400).json({ success: false, message: error });
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

      // --- collect inventory restock info (no DB write yet)
      let productDoc = null;
      const candidateProductId =
        productId || billItem.productId || billItem.ProductId || null;

      if (candidateProductId && mongoose.isValidObjectId(candidateProductId)) {
        productDoc = await IndexModel.Product.findOne(
          {
            _id: candidateProductId,
            companyId,
            deleted: false,
          },
          { _id: 1 } // we only need id here
        ).lean();
      } else if (!candidateProductId && billItem.sku) {
        productDoc = await IndexModel.Product.findOne(
          {
            SKU: billItem.sku,
            companyId,
            deleted: false,
          },
          { _id: 1 }
        ).lean();
      }

      if (productDoc) {
        const key = String(productDoc._id);
        const existing = productRestockMap.get(key) || { qty: 0 };
        existing.qty += quantityReq;
        productRestockMap.set(key, existing);
      }

      // --- money for this line
      const unitPrice = n(billItem.price);
      const lineDelta = unitPrice * quantityReq;
      deltaRefundAmount += lineDelta;

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

      billItem.status =
        totalRefundedQtyForLine >= originalQty
          ? 'refund_full'
          : 'refund_partial';

      // important: keep billItem.total as original line total,
      // since we are tracking refunds separately via refundAmount + status

      refundedItems.push({
        productId: String(billItem.productId || billItem.ProductId || ''),
        orderItemId: String(billItem.orderItemId || billItem.OrderItemId || ''),
        sku: billItem.sku,
        itemName: billItem.itemName,
        quantity: quantityReq,
        refundAmount: lineDelta,
        status: billItem.status,
      });

      // --- optional order sync bucket
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

    // --------- Recalculate bill totals & refund summary ---------

    recalcBillTotals(bill);

    const prevTotalRefund = n(bill?.refundDetails?.totalRefundAmount);
    const cumulativeRefund = prevTotalRefund + deltaRefundAmount;

    const allLinesRefunded = (bill.items || []).every((it) =>
      ['refund_full', 'cancelled', 'returned_accept'].includes(
        String(it.status || '').toLowerCase()
      )
    );

    bill.status = allLinesRefunded ? 'refunded' : 'partially_refunded';

    bill.refundDetails = {
      ...(bill.refundDetails || {}),
      totalRefundAmount: cumulativeRefund,
      refundedAt: now,
      refundedBy: userId,
      refundReason:
        sanitizedNotes ||
        (allLinesRefunded ? 'Full refund (all items)' : 'Partial refund'),
    };

    pushHistory(
      `Bill ${bill.status} – this operation refund: ${deltaRefundAmount.toFixed(
        2
      )}`,
      sanitizedNotes
    );

    await bill.save();

    // --------- Sync to Orders (Shopify-like: keep paidAmount, track refunds & status) ---------

    if (ordersTouched.size > 0) {
      for (const [orderId, info] of ordersTouched.entries()) {
        const order = await IndexModel.Orders.findOne({
          _id: orderId,
          companyId,
          deleted: { $ne: true },
        });
        if (!order) continue;

        // item-level refund history
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

        // order-level refund & payment status
        const prevOrderRefund = n(order.refundTotal);
        const newOrderRefundTotal = prevOrderRefund + n(info.deltaAmount);
        order.refundTotal = newOrderRefundTotal;

        // keep paidAmount as "amount charged"
        const orderTotal = n(order.total || order.subTotal || 0);
        const netPaid = n(order.paidAmount) - newOrderRefundTotal;

        if (newOrderRefundTotal <= 0) {
          // no refunds, keep existing status
        } else if (netPaid <= 0 || newOrderRefundTotal >= orderTotal - 0.01) {
          order.paymentStatus = 'refunded'; // fully refunded
        } else {
          order.paymentStatus = 'partially_refunded';
        }

        order.history = order.history || [];
        order.history.push({
          action: 'refunded',
          performedBy: userId || 'system',
          createdAt: now,
          notes: `Refund via bill ${bill.billNumber || bill._id} amount ${
            info.deltaAmount
          }`,
        });

        await order.save();
      }
    }

    // Additionally, if bill has direct OrderId, update that order's paymentStatus in a simple way
    if (bill.OrderId) {
      const refundStatus =
        bill.status === 'refunded' ? 'refunded' : 'partially_refunded';

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
    }

    // --------- Apply product restocks at the end ---------

    if (productRestockMap.size > 0) {
      const now2 = new Date();
      const bulkOps = [];

      for (const [productId, info] of productRestockMap.entries()) {
        const { qty } = info;

        bulkOps.push({
          updateOne: {
            filter: {
              _id: productId,
              companyId,
              deleted: { $ne: true },
            },
            update: {
              $inc: {
                quantity: qty,
                totalReturned: qty,
              },
              $push: {
                history: {
                  action: `Refund: ${qty} unit(s) returned from bill ${
                    bill.billNumber || bill._id
                  }`,
                  performedBy: userId,
                  at: now2,
                },
              },
              $set: { updatedAt: now2 },
            },
          },
        });
      }

      if (bulkOps.length) {
        await IndexModel.Product.bulkWrite(bulkOps, { ordered: true });
      }
    }

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
