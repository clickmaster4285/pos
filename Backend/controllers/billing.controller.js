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
      items,
      buyer,
      taxPercent: providedTaxPercent,
      notes = '',
      paymentMethod,
      paymentNumber,
    } = req.body ?? {};

    console.log('createBill payload:', { items, buyer, taxPercent: providedTaxPercent, paymentMethod, paymentNumber });

    // Top-level validation
    if (!Array.isArray(items) || items.length === 0) {
      console.error('Validation error: Items must be a non-empty array');
      throw new Error('Items must be a non-empty array');
    }

    if (!['cash', 'credit_card', 'bank_transfer'].includes(paymentMethod)) {
      console.error('Validation error: Invalid payment method:', paymentMethod);
      throw new Error('Invalid payment method');
    }

    const sanitizedNotes = sanitizeInput(notes);
    if (
      sanitizedNotes &&
      (typeof sanitizedNotes !== 'string' ||
        sanitizedNotes.length > 1000 ||
        !/^[\w\s.,!?-]*$/.test(sanitizedNotes))
    ) {
      console.error('Validation error: Invalid notes format or length');
      throw new Error('Invalid notes format or length');
    }

    // Validate buyer details for non-cash payments
    if (
      ['credit_card', 'bank_transfer'].includes(paymentMethod) && !paymentNumber?.trim()) {
      console.error('Validation error: Invalid buyer details or payment number');
      throw new Error('Buyer details and payment number are required for non-cash payments');
    }

    // Fetch company settings
    const company = await IndexModel.Company.findOne({
      companyId,
      deleted: false,
      isActive: true,
    });
    if (!company) {
      console.error('Validation error: Company not found for companyId:', companyId);
      throw new Error('Company not found');
    }

    const taxRates = {
      taxRateCash: company?.invoiceSettings?.tax?.taxRateCash || 0,
      taxRateCard: company?.invoiceSettings?.tax?.taxRateCard || 0,
    };

    let taxPercent = paymentMethod === 'cash' ? taxRates.taxRateCash : taxRates.taxRateCard;

    // Validate provided taxPercent
    if (providedTaxPercent !== undefined) {
      if (typeof providedTaxPercent !== 'number' || providedTaxPercent < 0) {
        console.error('Validation error: Provided taxPercent must be a number ≥ 0:', providedTaxPercent);
        throw new Error('Provided taxPercent must be a number ≥ 0');
      }
      if (
        (paymentMethod === 'cash' && providedTaxPercent !== taxRates.taxRateCash) ||
        ((paymentMethod === 'credit_card' || paymentMethod === 'bank_transfer') &&
          providedTaxPercent !== taxRates.taxRateCard)
      ) {
        console.error('Validation error: taxPercent does not match company settings');
        throw new Error('Provided taxPercent does not match company tax settings');
      }
    }

    // Validate and resolve items
    const productItems = await Promise.all(
      items.map(async (item) => {
        if (!item.productId || !mongoose.isValidObjectId(item.productId)) {
          console.error('Validation error: Invalid or missing productId for item:', item);
          throw new Error(`Invalid or missing productId for ${item.itemName}`);
        }
        const product = await IndexModel.Product.findOne({
          _id: item.productId,
          companyId,
          deleted: false,
          isActive: true,
        });
        if (!product) {
          console.error('Validation error: Product not found for productId:', item.productId);
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        if (product.quantity < item.quantity) {
          console.error('Validation error: Insufficient stock for product:', product.productName, 'Requested:', item.quantity, 'Available:', product.quantity);
          throw new Error(`Insufficient stock for ${item.itemName}`);
        }
        return {
          productId: product._id,
          sku: item.sku,
          itemName: item.itemName,
          categoryName: item.categoryName,
          subCategory: item.subCategory || '',
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        };
      })
    );

    // Calculate totals
    const subtotal = productItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxPercent) / 100;
    const total = subtotal + taxAmount;

    // Create bill
    const billNumber = await generateBillNumber(companyId);
    const bill = new IndexModel.Bill({
      billNumber,
      companyId,
      createdBy: userId,
      items: productItems,
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
    });

    // Update product stock
    await Promise.all(
      productItems.map(async (item) => {
        const result = await IndexModel.Product.updateOne(
          { _id: item.productId, companyId },
          {
            $inc: {
              quantity: -item.quantity,
              totalOrdered: item.quantity,
            },
            $push: {
              history: {
                action: `Bill ${billNumber}: ${item.quantity} units sold`,
                performedBy: userId,
                createdAt: new Date(),
              },
            },
          }
        );
        if (result.modifiedCount === 0) {
          console.error('Stock update failed for productId:', item.productId);
          throw new Error(`Failed to update stock for product ${item.sku}`);
        }
      })
    );
    await bill.save();

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

const updateItemStatus = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { billId } = req.params;
    const { refundItems = [], notes = '' } = req.body;

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

    const sanitizedNotes = sanitizeInput(notes);
    if (sanitizedNotes && (typeof sanitizedNotes !== 'string' || sanitizedNotes.length > 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notes format or length',
      });
    }

    const n = (v) => Number(v || 0);
    const pushHistory = (action, note = '') => {
      bill.history = bill.history || [];
      bill.history.push({
        action,
        performedBy: userId,
        notes: note.trim() || undefined,
        createdAt: new Date(),
      });
    };

    let deltaRefundAmount = 0;
    const refundedItems = [];

    const recomputeBillTotalsByFullyReturnedLines = () => {
      const sumEligible = bill.items.reduce((sum, it) => {
        return ['cancelled', 'returned_accept'].includes(it.status)
          ? sum
          : sum + (it.total || 0);
      }, 0);

      bill.subtotal = +sumEligible.toFixed(2);
      bill.taxAmount = +(bill.subtotal * (bill.taxPercent / 100)).toFixed(2);
      bill.total = +(bill.subtotal + bill.taxAmount).toFixed(2);
    };

    for (const refundItem of refundItems) {
      if (
        !refundItem?.sku ||
        !Number.isInteger(refundItem.quantity) ||
        refundItem.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid refund item: SKU and positive quantity required',
        });
      }

      const billItem = bill.items.find((it) => it.sku === refundItem.sku);
      if (!billItem) {
        return res.status(400).json({
          success: false,
          message: `Item with SKU ${refundItem.sku} not found in bill`,
        });
      }

      const alreadyRefunded = billItem.refundHistory?.reduce(
        (sum, r) => sum + (r.refundQuantity || 0),
        0
      ) || 0;
      const remainingQty = billItem.quantity - alreadyRefunded;

      if (refundItem.quantity > remainingQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot refund ${refundItem.quantity} units of ${billItem.sku}: only ${remainingQty} available`,
        });
      }

      const product = await IndexModel.Product.findOne({
        SKU: billItem.sku,
        companyId,
        deleted: false,
      });

      if (product) {
        await IndexModel.Product.updateOne(
          { _id: product._id },
          {
            $inc: {
              quantity: refundItem.quantity,
              totalReturned: refundItem.quantity,
            },
            $push: {
              history: {
                action: `Refund: ${refundItem.quantity} units of ${billItem.sku} returned to product`,
                performedBy: userId,
              },
            },
          }
        );
      }

      const unitPrice = n(billItem.price);
      const lineDelta = unitPrice * refundItem.quantity;

      if (refundItem.quantity === remainingQty) {
        billItem.status = 'returned_accept';
      } else {
        billItem.status = 'returned_request';
      }

      billItem.refundAmount = n(billItem.refundAmount) + lineDelta;
      billItem.refundHistory = Array.isArray(billItem.refundHistory)
        ? billItem.refundHistory
        : [];
      billItem.refundHistory.push({
        refundQuantity: refundItem.quantity,
        refundAmount: lineDelta,
        refundReason: sanitizeInput(refundItem.reason) || 'Partial refund',
        refundedBy: userId,
        refundedAt: new Date(),
      });

      deltaRefundAmount += lineDelta;
      refundedItems.push({
        sku: billItem.sku,
        itemName: billItem.itemName,
        quantity: refundItem.quantity,
        refundAmount: lineDelta,
      });
    }

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
        sanitizedNotes ||
        (allFullyReturned ? 'Full refund via partials' : 'Partial refund'),
    };

    pushHistory(
      `Bill ${bill.status} - Total refund (this op): $${deltaRefundAmount.toFixed(2)}`,
      sanitizedNotes
    );

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