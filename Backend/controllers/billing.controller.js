// bill.controller.js (strengthened, no sanitizeHtml, express-validator, or transactions)
import IndexModel from '../models/indexModel.js';
import { generateBillNumber } from '../utils/generateBillNumber.js'; // reuse your generator
import mongoose from 'mongoose';

const createBill = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      items,
      buyer,
      taxPercent: providedTaxPercent,
      notes = '',
      paymentMethod,
      paymentNumber,
    } = req.body ?? {};
    // console.log("the body", req.body);
    // Top-level validation
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }

    if (!['cash', 'credit_card', 'bank_transfer'].includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }

    if (
      notes &&
      (typeof notes !== 'string' ||
        notes.length > 1000 ||
        !/^[\w\s.,!?-]*$/.test(notes))
    ) {
      throw new Error('Invalid notes format or length');
    }

    // Fetch company settings to get tax rates
    const company = await IndexModel.Company.findOne({
      companyId: req.user.companyId,
      deleted: false,
      isActive: true,
    });
    if (!company) {
      throw new Error('Company not found');
    }

    const taxRates = {
      taxRateCash: company?.invoiceSettings?.tax?.taxRateCash || 0,
      taxRateCard: company?.invoiceSettings?.tax?.taxRateCard || 0,
    };

    let taxPercent;
    if (paymentMethod === 'cash') {
      taxPercent = taxRates.taxRateCash;
    } else if (
      paymentMethod === 'credit_card' ||
      paymentMethod === 'bank_transfer'
    ) {
      taxPercent = taxRates.taxRateCard;
    } else {
      taxPercent = 0;
    }

    console.log('teh tax rates', taxPercent, providedTaxPercent);
    // Validate provided taxPercent, if any
    if (taxPercent !== undefined) {
      if (typeof taxPercent !== 'number' || taxPercent < 0) {
        throw new Error('Provided taxPercent must be a number ≥ 0');
      }
      if (
        (paymentMethod === 'cash' && taxPercent !== taxRates.taxRateCash) ||
        ((paymentMethod === 'credit_card' ||
          paymentMethod === 'bank_transfer') &&
          taxPercent !== taxRates.taxRateCard)
      ) {
        throw new Error(
          'Provided taxPercent does not match company tax settings for the selected payment method'
        );
      }
    }

    // Validate + resolve each requested item to an Inventory + Variant
    const inventoryItems = await Promise.all(
      items.map(async (item) => {
        console.log('the items', item);
        if (
          !item?.sku ||
          typeof item.sku !== 'string' ||
          !/^[A-Z0-9-]+$/.test(item.sku)
        ) {
          throw new Error('Each item must have a valid SKU');
        }
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error('Quantity must be a positive integer');
        }

        const inventory = await IndexModel.Inventory.findOne({
          'variants.sku': item.sku,
          isActive: true,
          deleted: false,
        });

        if (!inventory) {
          throw new Error(`Variant with SKU ${item.sku} not found`);
        }

        const variant = inventory.variants.find((v) => v.sku === item.sku);
        if (!variant) {
          throw new Error(`Variant with SKU ${item.sku} not found`);
        }

        if (variant.quantity < item.quantity) {
          throw new Error(
            `Insufficient quantity for ${item.sku}: available ${variant.quantity}, requested ${item.quantity}`
          );
        }

        const lineTotal = item.quantity * (variant.price ?? 0);

        return {
          inventoryItem: inventory._id,
          variantId: variant._id,
          variantName: variant.variantName,
          itemName: inventory.itemName,
          sku: variant.sku,
          quantity: item.quantity,
          returnUnder: variant.returnUnder,
          price: variant.price ?? 0,
          costPrice: variant.costPrice ?? 0,
          total: lineTotal,
          companyId: inventory.companyId,
        };
      })
    );

    // Group by companyId — one Bill per company
    const groups = inventoryItems.reduce((acc, item) => {
      const cid = item.companyId.toString();
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push(item);
      return acc;
    }, {});

    const affectedInventories = new Set();
    const createdBills = [];

    // Create bills and update variants
    for (const companyId in groups) {
      const groupItems = groups[companyId];

      // Compute bill amounts from items
      const subtotal = groupItems.reduce((sum, it) => sum + (it.total || 0), 0);
      const taxAmount = +(subtotal * (taxPercent / 100)).toFixed(2);
      const total = +(subtotal + taxAmount).toFixed(2);

      // Generate bill number
      const billNumber = await generateBillNumber(companyId);

      const bill = new IndexModel.Bill({
        billNumber,
        userId,
        companyId,
        createdBy: userId,
        buyer: {
          name: buyer.name?.trim(),
          email: buyer.email || '',
          phone: buyer.phone || '',
        },
        items: groupItems.map(({ companyId: _omit, ...rest }) => rest),
        subtotal,
        taxPercent,
        taxAmount,
        total,
        paymentMethod,
        paymentNumber,
        notes: notes || '',
        history: [
          {
            action: 'Bill created',
            performedBy: userId,
          },
        ],
        status: 'paid',
      });

      // Save bill
      await bill.save();
      createdBills.push(bill);

      // Update inventory variants
      for (const item of groupItems) {
        const inventory = await IndexModel.Inventory.findById(
          item.inventoryItem
        );
        const variant = inventory?.variants.find((v) =>
          v._id.equals(item.variantId)
        );

        if (!variant) {
          throw new Error(`Variant ${item.sku} not found`);
        }
        if (variant.quantity < item.quantity) {
          throw new Error(
            `Insufficient quantity for ${item.sku}: available ${variant.quantity}, requested ${item.quantity}`
          );
        }

        const remainingAfter = variant.quantity - item.quantity;
        const newTotalOrdered = (variant.totalOrdered ?? 0) + item.quantity;

        const result = await IndexModel.Inventory.updateOne(
          {
            _id: item.inventoryItem,
            variants: {
              $elemMatch: {
                _id: item.variantId,
                quantity: { $gte: item.quantity },
              },
            },
          },
          {
            $inc: {
              'variants.$.quantity': -item.quantity,
              'variants.$.totalOrdered': item.quantity,
            },
            $set: {
              'variants.$.lastOrderedDate': new Date(),
            },
            $push: {
              history: {
                action: `Bill ${billNumber}: ${variant.variantName} (${item.sku}) −${item.quantity} (remaining ${remainingAfter}, totalOrdered → ${newTotalOrdered})`,
                performedBy: userId,
              },
            },
          }
        );

        if (result.matchedCount === 0) {
          throw new Error(
            `Failed to update variant ${item.sku}: insufficient quantity or not found`
          );
        }

        affectedInventories.add(item.inventoryItem.toString());
      }
    }

    // Recalculate inventory totals
    for (const invId of affectedInventories) {
      const inventory = await IndexModel.Inventory.findById(invId);
      if (inventory) {
        inventory.markModified('variants');
        await inventory.save();
      }
    }

    // Build response with enhanced item details
    const responseBills = await Promise.all(
      createdBills.map(async (bill) => {
        const enhancedItems = await Promise.all(
          bill.items.map(async (item) => {
            const inventory = await IndexModel.Inventory.findById(
              item.inventoryItem
            );
            const variant = inventory?.variants.find((v) =>
              v._id.equals(item.variantId)
            );

            return {
              ...item.toObject(),
              totalOrderedThisBill: item.quantity,
              remainingAfterBill: variant ? variant.quantity : 'N/A',
              totalOrderedOverall: variant ? variant.totalOrdered ?? 0 : 'N/A',
              totalSold: variant ? variant.totalSold ?? 0 : 'N/A',
              totalRevenue: variant ? variant.totalRevenue ?? 0 : 'N/A',
              lowStockAlert:
                variant && typeof variant.lowStockThreshold === 'number'
                  ? variant.quantity <= variant.lowStockThreshold
                    ? 'Yes'
                    : 'No'
                  : 'N/A',
            };
          })
        );

        return { ...bill.toObject(), items: enhancedItems };
      })
    );

    res.status(201).json({
      success: true,
      message: 'Bill(s) created successfully',
      bills: responseBills,
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating bill(s)',
      error: error.message,
    });
  }
};

const getBills = async (req, res) => {
  try {
    const { companyId } = req.user;

    // Fetch all non-deleted bills for this company
    const bills = await IndexModel.Bill.find({
      companyId,
      deleted: false,
    }).lean();

    // Attach the user name for each bill
    const data = await Promise.all(
      bills.map(async (bill) => {
        const user = await IndexModel.User.findOne({
          userId: bill.userId, // still a string field
          companyId: bill.companyId,
          deleted: false,
        }).lean();

        return {
          ...bill,
          userName: user ? user.name : null,
        };
      })
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return res.status(400).json({
      message: 'Error fetching bills',
      error: error.message,
    });
  }
};

// PATCH /api/billing/update-bills-status/:id  (or :billId)
// Body:
//  {
//    "refundItems": [{ "sku": "SKU1", "quantity": 2, "reason": "..." }],
//    "notes": "optional"
//  }
// Behavior:
//  - If refundItems missing/empty -> FULL refund
//  - Else PARTIAL refund
//  - If after partial all items are fully refunded -> flip to FULL
const updateItemStatus = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const billId = req.params.billId || req.params.id;
    const { refundItems = [], notes = '' } = req.body || {};

    const bill = await IndexModel.Bill.findOne({
      _id: billId,
      companyId,
      deleted: false,
    });
    if (!bill) throw new Error('Bill not found');

    if (bill.status === 'refunded') {
      throw new Error('Bill is already fully refunded');
    }

    // ---------------- helpers ----------------
    const n = (v) => Number(v || 0);

    const pushHistory = (action, note = '') => {
      bill.history.push({
        action,
        performedBy: userId,
        notes: note || '',
      });
    };

    const restockVariant = async ({
      inventoryItemId,
      variantId,
      qty,
      label,
    }) => {
      const result = await IndexModel.Inventory.updateOne(
        { _id: inventoryItemId, 'variants._id': variantId },
        {
          $inc: {
            'variants.$.quantity': qty,
            'variants.$.totalOrdered': -qty,
          },
          $push: {
            history: {
              action: `${label}`,
              performedBy: userId,
            },
          },
        }
      );
      if (result.modifiedCount === 0) {
        throw new Error(
          `Failed to update inventory for variant ${String(variantId)}`
        );
      }
    };

    const alreadyRefundedQty = (item) =>
      (Array.isArray(item.refundHistory) ? item.refundHistory : []).reduce(
        (s, r) => s + n(r.refundQuantity),
        0
      );

    // Sum of full line totals for NON-cancelled & NON-fully-returned lines
    const recomputeBillTotalsByFullyReturnedLines = () => {
      const subtotal = bill.items.reduce((sum, it) => {
        const fullyReturned = it.status === 'returned_accept';
        const cancelled = it.status === 'cancelled';
        return fullyReturned || cancelled ? sum : sum + n(it.total);
      }, 0);
      const taxPct = n(bill.taxPercent) / 100;
      bill.subtotal = +subtotal.toFixed(2);
      bill.taxAmount = +(subtotal * taxPct).toFixed(2);
      bill.total = +(bill.subtotal + bill.taxAmount).toFixed(2);
    };

    // --------------- main logic ----------------
    let deltaRefundAmount = 0;
    let refundedItems = [];

    const isFullRefundRequested =
      !Array.isArray(refundItems) || refundItems.length === 0;

    if (isFullRefundRequested) {
      // FULL REFUND of all remaining quantities
      for (const item of bill.items) {
        const prevQty = alreadyRefundedQty(item);
        const remainingQty = Math.max(0, n(item.quantity) - prevQty);
        if (remainingQty <= 0 || item.status === 'returned_accept') continue;

        await restockVariant({
          inventoryItemId: item.inventoryItem,
          variantId: item.variantId,
          qty: remainingQty,
          label: `Refund: Bill ${bill.billNumber} - ${remainingQty} units of ${item.sku} returned to inventory`,
        });

        const unitPrice = n(item.price);
        const lineDelta = unitPrice * remainingQty;

        item.status = 'returned_accept';
        item.refundAmount = n(item.refundAmount) + lineDelta;
        item.refundHistory = Array.isArray(item.refundHistory)
          ? item.refundHistory
          : [];
        item.refundHistory.push({
          refundQuantity: remainingQty,
          refundAmount: lineDelta,
          refundReason: notes || 'Full bill refund',
          refundedBy: userId,
        });

        deltaRefundAmount += lineDelta;
        refundedItems.push({
          sku: item.sku,
          itemName: item.itemName,
          quantity: remainingQty,
          refundAmount: lineDelta,
        });
      }

      // Recompute totals (now all lines fully returned -> subtotal becomes 0)
      recomputeBillTotalsByFullyReturnedLines();

      // cumulative total
      const prevTotalRefund = n(bill?.refundDetails?.totalRefundAmount);
      const cumulativeRefund = prevTotalRefund + deltaRefundAmount;

      bill.status = bill.total === 0 ? 'refunded' : 'partially_refunded';
      bill.refundDetails = {
        ...(bill.refundDetails || {}),
        totalRefundAmount: cumulativeRefund,
        refundedAt: new Date(),
        refundedBy: userId,
        refundReason: notes || 'Full refund',
      };

      pushHistory(
        `Bill ${
          bill.status
        } - Total refund (this op): $${deltaRefundAmount.toFixed(2)}`,
        notes
      );
    } else {
      // PARTIAL REFUND — do NOT change bill subtotal by partial amounts
      // Only drop a line from subtotal when that line becomes fully returned.

      // Group by SKU (UI may send duplicates)
      const skuMap = new Map();
      for (const r of refundItems) {
        const q = n(r.quantity);
        if (q <= 0) continue;
        const prev = skuMap.get(r.sku) || { quantity: 0, reasons: [] };
        skuMap.set(r.sku, {
          quantity: prev.quantity + q,
          reasons: [...prev.reasons, r.reason].filter(Boolean),
        });
      }
      const groupedRefunds = Array.from(skuMap.entries()).map(([sku, v]) => ({
        sku,
        quantity: v.quantity,
        reason: v.reasons.join(' | ') || 'Partial refund',
      }));

      if (groupedRefunds.length === 0) {
        // treat as full refund of remaining
        req.body.refundItems = [];
        return await updateItemStatus(req, res);
      }

      for (const refundItem of groupedRefunds) {
        const billItem = bill.items.find(
          (it) => it.sku === refundItem.sku && it.status !== 'returned_accept'
        );
        if (!billItem) {
          throw new Error(
            `Item with SKU ${refundItem.sku} not found or already fully refunded`
          );
        }

        const prevQty = alreadyRefundedQty(billItem);
        const remainingQty = Math.max(0, n(billItem.quantity) - prevQty);

        if (refundItem.quantity > remainingQty) {
          throw new Error(
            `Refund qty (${refundItem.quantity}) exceeds remaining refundable qty (${remainingQty}) for ${billItem.sku}`
          );
        }

        // Restock the partial quantity
        await restockVariant({
          inventoryItemId: billItem.inventoryItem,
          variantId: billItem.variantId,
          qty: refundItem.quantity,
          label: `Partial Refund: Bill ${bill.billNumber} - ${refundItem.quantity} units of ${billItem.sku} returned to inventory`,
        });

        const unitPrice = n(billItem.price);
        const lineDelta = unitPrice * refundItem.quantity;

        // Update line refund state
        if (refundItem.quantity === remainingQty) {
          billItem.status = 'returned_accept'; // now fully returned -> will be excluded from subtotal
        } else {
          billItem.status = 'returned_request'; // still counts in subtotal at full line total
        }

        billItem.refundAmount = n(billItem.refundAmount) + lineDelta;
        billItem.refundHistory = Array.isArray(billItem.refundHistory)
          ? billItem.refundHistory
          : [];
        billItem.refundHistory.push({
          refundQuantity: refundItem.quantity,
          refundAmount: lineDelta,
          refundReason: refundItem.reason || 'Partial refund',
          refundedBy: userId,
        });

        deltaRefundAmount += lineDelta;
        refundedItems.push({
          sku: billItem.sku,
          itemName: billItem.itemName,
          quantity: refundItem.quantity,
          refundAmount: lineDelta,
        });
      }

      // Recompute totals based ONLY on fully returned/cancelled lines
      recomputeBillTotalsByFullyReturnedLines();

      const prevTotalRefund = n(bill?.refundDetails?.totalRefundAmount);
      const cumulativeRefund = prevTotalRefund + deltaRefundAmount;

      const allFullyReturned = bill.items.every(
        (it) => it.status === 'returned_accept' || it.status === 'cancelled'
      );
      bill.status = allFullyReturned ? 'refunded' : 'partially_refunded';

      bill.refundDetails = {
        ...(bill.refundDetails || {}),
        totalRefundAmount: cumulativeRefund,
        refundedAt: new Date(),
        refundedBy: userId,
        refundReason:
          notes ||
          (allFullyReturned ? 'Full refund via partials' : 'Partial refund'),
      };

      pushHistory(
        `Bill ${
          bill.status
        } - Total refund (this op): $${deltaRefundAmount.toFixed(2)}`,
        notes
      );
    }

    await bill.save();

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
    console.error('Error changing bill status:', error);
    return res.status(400).json({
      success: false,
      message: 'Error processing refund',
      error: error.message,
    });
  }
};

// bill.controller.js - Add delete function
const deleteBill = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { billId } = req.params;

    // Find the bill
    const bill = await IndexModel.Bill.findOne({
      _id: billId,
      companyId,
      deleted: false,
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    // Return all items to inventory
    for (const item of bill.items) {
      if (item.status !== 'returned_accept' && item.status !== 'cancelled') {
        const inventory = await IndexModel.Inventory.findOne({
          _id: item.inventoryItem,
          companyId,
          deleted: false,
        });

        if (inventory) {
          const variant = inventory.variants.find((v) =>
            v._id.equals(item.variantId)
          );

          if (variant) {
            const result = await IndexModel.Inventory.updateOne(
              {
                _id: item.inventoryItem,
                'variants._id': item.variantId,
              },
              {
                $inc: {
                  'variants.$.quantity': item.quantity,
                  'variants.$.totalOrdered': -item.quantity,
                },
                $push: {
                  history: {
                    action: `Bill Deleted: ${item.quantity} units of ${item.sku} returned to inventory (Bill ${bill.billNumber})`,
                    performedBy: userId,
                  },
                },
              }
            );

            if (result.modifiedCount === 0) {
              throw new Error(`Failed to update inventory for ${item.sku}`);
            }
          }
        }
      }
    }

    // Soft delete the bill and zero out amounts
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
      action: 'Bill deleted and all items returned to inventory',
      performedBy: userId,
    });

    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully and all items returned to inventory',
      data: {
        billNumber: bill.billNumber,
        deletedAt: bill.deletedAt,
      },
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(400).json({
      success: false,
      message: 'Error deleting bill',
      error: error.message,
    });
  }
};

export default {
  createBill,
  getBills,
  updateItemStatus,
  deleteBill,
};
