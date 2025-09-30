// order.controller.js (strengthened, no sanitizeHtml, express-validator, or transactions)
import IndexModel from '../models/indexModel.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import mongoose from 'mongoose';

const addHistoryEntry = (order, action, performedBy) => {
  order.history.push({
    action,
    performedBy,
    createdAt: new Date(),
  });
};

const createOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { items, orderType, shippingAddressId, paymentMethod, notes } =
      req.body;

    // Manual input validation
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }
    if (!['purchase', 'service'].includes(orderType)) {
      throw new Error('Invalid order type');
    }
    // console.log("the shippingAddressId are: ", shippingAddressId)
    if (!/^[0-9a-fA-F]{24}$/.test(shippingAddressId)) {
      throw new Error('Invalid shipping address ID');
    }
    if (
      !['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cod'].includes(
        paymentMethod
      )
    ) {
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

    // Validate and fetch inventory items/variants
    const inventoryItems = await Promise.all(
      items.map(async (item) => {
        if (
          !item.sku ||
          typeof item.sku !== 'string' ||
          !/^[A-Z0-9-]+$/.test(item.sku)
        ) {
          throw new Error('Each item must have a valid SKU');
        }
        if (
          !item.quantity ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0
        ) {
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
            `Insufficient quantity for variant ${item.sku}: available ${variant.quantity}, requested ${item.quantity}`
          );
        }

        return {
          inventoryItem: inventory._id,
          variantId: variant._id,
          variantName: variant.variantName,
          itemName: inventory.itemName,
          sku: variant.sku,
          quantity: item.quantity,
          returnUnder: variant.returnUnder,
          price: variant.price,
          costPrice: variant.costPrice || 0,
          total: item.quantity * variant.price,
          companyId: inventory.companyId,
        };
      })
    );

    // Group items by companyId
    const groups = inventoryItems.reduce((acc, item) => {
      const cid = item.companyId.toString();
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push(item);
      return acc;
    }, {});

    const affectedInventories = new Set();
    const createdOrders = [];

    // Create orders and update variants sequentially
    for (const companyId in groups) {
      const groupItems = groups[companyId];
      const totalAmount = groupItems.reduce((sum, item) => sum + item.total, 0);
      const orderNumber = await generateOrderNumber(companyId);
      // console.log("the companyId: ", companyId)
      const order = new IndexModel.Order({
        orderNumber,
        userId,
        companyId,
        items: groupItems.map(({ companyId, ...rest }) => rest),
        totalAmount,
        orderType,
        shippingAddressId,
        paymentMethod,
        notes: notes || '',
        history: [
          {
            action: 'Order created',
            performedBy: userId,
          },
        ],
      });

      await order.save();
      createdOrders.push(order);

      // Update variant quantities sequentially
      for (const item of groupItems) {
        const inventory = await IndexModel.Inventory.findById(
          item.inventoryItem
        );
        const variant = inventory.variants.find((v) =>
          v._id.equals(item.variantId)
        );

        if (!variant) {
          throw new Error(`Variant ${item.sku} not found`);
        }

        if (variant.quantity < item.quantity) {
          throw new Error(
            `Insufficient quantity for variant ${item.sku}: available ${variant.quantity}, requested ${item.quantity}`
          );
        }

        const remainingAfter = variant.quantity - item.quantity;
        const newTotalOrdered = variant.totalOrdered + item.quantity;

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
                action: `Order ${orderNumber}: Variant ${variant.variantName} (${item.sku}) Removed ${item.quantity} (remaining: ${remainingAfter}, totalOrdered now: ${newTotalOrdered})`,
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

    // Prepare response
    const responseOrders = await Promise.all(
      createdOrders.map(async (order) => {
        const enhancedItems = await Promise.all(
          order.items.map(async (item) => {
            const inventory = await IndexModel.Inventory.findById(
              item.inventoryItem
            );
            const variant = inventory.variants.find((v) =>
              v._id.equals(item.variantId)
            );
            return {
              ...item.toObject(),
              totalOrderedThisOrder: item.quantity,
              remainingAfterOrder: variant ? variant.quantity : 'N/A',
              totalOrderedOverall: variant ? variant.totalOrdered : 'N/A',
              totalSold: variant ? variant.totalSold : 'N/A',
              totalRevenue: variant ? variant.totalRevenue : 'N/A',
              lowStockAlert:
                variant && variant.quantity <= variant.lowStockThreshold
                  ? 'Yes'
                  : 'No',
            };
          })
        );
        return { ...order.toObject(), items: enhancedItems };
      })
    );

    res.status(201).json({
      success: true,
      message: 'Orders created successfully',
      orders: responseOrders,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating order(s)',
      error: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { companyId } = req.user;

    const orders = await IndexModel.Order.find({
      companyId,
      deleted: false,
    }).lean();
    console.log('the orders are :');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res
      .status(400)
      .json({ message: 'Error fetching orders', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await IndexModel.Order.findOne({ _id: id, deleted: false })
      .populate('items.inventoryItem', 'itemName companyId variants')
      .populate('assignedTo', 'name email')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const enhancedItems = order.items.map((item) => {
      const inventory = item.inventoryItem;
      const variant = inventory.variants.find(
        (v) => v._id.toString() === item.variantId.toString()
      );
      return {
        ...item,
        currentRemaining: variant ? variant.quantity : 'N/A',
      };
    });

    res.status(200).json({ ...order, items: enhancedItems });
  } catch (error) {
    console.error('Error fetching order:', error);
    res
      .status(400)
      .json({ message: 'Error fetching order', error: error.message });
  }
};

// controllers/orderController.js
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const performedBy = req.user.userId;

  try {
    const order = await IndexModel.Order.findOne({ _id: id, deleted: false });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const statusSequence = ['pending', 'processing', 'shipped', 'delivered'];
    let updated = false;

    order.items = order.items.map((item) => {
      const currentIndex = statusSequence.indexOf(item.status);

      if (currentIndex !== -1 && currentIndex < statusSequence.length - 1) {
        const newStatus = statusSequence[currentIndex + 1];
        updated = true;

        // ✅ Push history entry for this specific item
        addHistoryEntry(order, `${item.status} → ${newStatus}`, performedBy);

        return {
          ...item.toObject(),
          status: newStatus,
        };
      }

      return item; // unchanged
    });

    if (!updated) {
      return res
        .status(400)
        .json({ message: 'No items eligible for status update' });
    }

    await order.save();

    res.status(200).json({
      message: `Statuses updated for eligible items`,
      order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const cancelOrderItems = async (req, res) => {
  const { id, itemIds } = req.params; // orderId, comma-separated itemIds
  const performedBy = req.user.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    // Convert comma-separated itemIds string -> array
    const itemIdArray = itemIds ? itemIds.split(',') : [];

    if (itemIdArray.length === 0) {
      return res
        .status(400)
        .json({ message: 'itemIds must be provided in params' });
    }

    const order = await IndexModel.Order.findOne({ _id: id, deleted: false });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const cancellableStatuses = ['pending', 'processing'];
    let cancelledItems = [];
    let skippedItems = [];

    for (const itemId of itemIdArray) {
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        skippedItems.push({ itemId, reason: 'Invalid itemId' });
        continue;
      }

      const item = order.items.id(itemId);
      if (!item) {
        skippedItems.push({ itemId, reason: 'Item not found' });
        continue;
      }

      if (!cancellableStatuses.includes(item.status)) {
        skippedItems.push({
          itemId,
          reason: `Item cannot be cancelled from status ${item.status}`,
        });
        continue;
      }

      // ✅ Cancel the item
      item.status = 'cancelled';
      cancelledItems.push({
        itemId: item._id,
        itemName: item.itemName,
        sku: item.sku,
      });

      // 🔹 Update Inventory variant
      await IndexModel.Inventory.updateOne(
        { _id: item.inventoryItem, 'variants._id': item.variantId },
        {
          $inc: {
            'variants.$.quantity': item.quantity, // restore stock
            'variants.$.totalOrdered': -item.quantity, // adjust ordered
          },
          $push: {
            history: {
              action: `Order ${order.orderNumber}: Variant ${item.variantName} (${item.sku}) Cancelled ${item.quantity} (restored to inventory)`,
              performedBy,
              createdAt: new Date(),
            },
          },
        }
      );

      // 🔹 Add order history entry
      order.history.push({
        action: `Item Cancelled`,
        itemId: item._id,
        itemName: item.itemName,
        sku: item.sku,
        performedBy,
        createdAt: new Date(),
      });
    }

    // 🔹 Recalculate order total
    order.totalAmount = order.items.reduce((sum, item) => {
      if (item.status !== 'cancelled') return sum + item.total;
      return sum;
    }, 0);

    // Save order
    await order.save();

    res.status(200).json({
      message: 'Order items cancellation processed',
      cancelledCount: cancelledItems.length,
      skippedCount: skippedItems.length,
      cancelledItems,
      skippedItems,
      updatedOrder: order,
    });
  } catch (error) {
    console.error('Error cancelling order items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const return_refundOrder = async (req, res) => {
  const { id, itemIds } = req.params;
  const performedBy = req.user.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await IndexModel.Order.findOne({ _id: id, deleted: false });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const targetedItemIds = itemIds.split(','); // or an array you already have
    const hasDeliveredItems = order.items.some(
      (item) =>
        targetedItemIds.includes(String(item._id)) &&
        item.status === 'delivered'
    );
    if (!hasDeliveredItems) {
      return res
        .status(400)
        .json({ message: 'No eligible items for return/refund' });
    }

    const deliveryEntry = order.history.find((h) =>
      h.action.toLowerCase().includes('delivered')
    );
    if (!deliveryEntry) {
      return res.status(400).json({ message: 'No delivery record found' });
    }

    const deliveryDate = new Date(deliveryEntry.createdAt);
    const now = new Date();
    const selectedItemIds = itemIds.split(',').map((id) => id.trim());

    let eligibleItems = [];
    let rejectedItems = [];

    for (let item of order.items) {
      if (selectedItemIds.includes(item._id.toString())) {
        const daysSinceDelivery = (now - deliveryDate) / (1000 * 60 * 60 * 24);
        if (daysSinceDelivery <= item.returnUnder) {
          eligibleItems.push(item);
        } else {
          rejectedItems.push({
            itemId: item._id,
            reason: `Return period expired (allowed ${item.returnUnder} days)`,
          });
        }
      }
    }

    if (eligibleItems.length === 0) {
      return res.status(400).json({
        message: 'No items eligible for return request',
        rejectedItems,
      });
    }

    // ✅ Update only item status → returned_request
    order.items = order.items.map((it) => {
      if (selectedItemIds.includes(it._id.toString())) {
        return { ...it.toObject(), status: 'returned_request' };
      }
      return it;
    });

    addHistoryEntry(
      order,
      `Return request for items: ${eligibleItems
        .map((i) => i.variantName)
        .join(', ')}`,
      performedBy
    );

    await order.save();

    res.status(200).json({
      message: 'Return request submitted',
      requestedItems: eligibleItems.map((i) => ({
        id: i._id,
        variant: i.variantName,
      })),
      rejectedItems,
      order,
    });
  } catch (error) {
    console.error('Error processing return request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const handleReturnRequest = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { action } = req.body; // action: 'accept' or 'reject'
    const performedBy = req.user.userId; // Assuming user authentication middleware sets req.user

    if (!['accept', 'reject'].includes(action)) {
      return res
        .status(400)
        .json({ message: 'Invalid action. Must be "accept" or "reject".' });
    }

    // Find the order
    const order = await IndexModel.Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Find the item in the order's items array
    const itemIndex = order.items.findIndex(
      (item) => item._id.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in order.' });
    }

    const item = order.items[itemIndex];

    // Check if the item is in 'returned_request' status
    if (item.status !== 'returned_request') {
      return res.status(400).json({
        message: `Item is not in a return requested state. Current status: ${item.status}.`,
      });
    }

    // Determine new status
    const newStatus =
      action === 'accept' ? 'returned_accept' : 'returned_reject';

    // Update item status
    item.status = newStatus;

    // If accepted, handle inventory update and refund
    if (action === 'accept') {
      // Calculate refund amount (assuming full refund; adjust logic if partial refunds are possible)
      item.refundAmount = item.quantity * item.price;
      // Set item.total to 0 since the item is returned and no longer contributes to order total
      item.total = 0;

      // Find the inventory and variant
      const inventory = await IndexModel.Inventory.findById(item.inventoryItem);
      if (!inventory) {
        return res.status(404).json({ message: 'Inventory item not found.' });
      }

      const variantIndex = inventory.variants.findIndex(
        (v) => v._id.toString() === item.variantId.toString()
      );
      if (variantIndex === -1) {
        return res
          .status(404)
          .json({ message: 'Variant not found in inventory.' });
      }

      const variant = inventory.variants[variantIndex];

      // Restore quantity to inventory
      variant.quantity += item.quantity;
      variant.totalReturned += item.quantity;
      variant.updatedAt = new Date();

      // Add history to inventory
      inventory.history.push({
        action: `Return accepted for Order ${order.orderNumber}: Variant ${variant.variantName} (${variant.sku}) Added ${item.quantity} (remaining: ${variant.quantity}, totalReturned now: ${variant.totalReturned})`,
        performedBy,
        createdAt: new Date(),
      });

      // Save inventory changes
      await inventory.save();
    }

    // Add history to order
    order.history.push({
      action: `Return ${action}ed for item: ${item.variantName}`,
      performedBy,
      createdAt: new Date(),
    });

    // Update payment status if accepted
    if (action === 'accept') {
      // Recalculate total refund across all items
      const totalRefund = order.items.reduce(
        (sum, i) => sum + (i.refundAmount || 0),
        0
      );

      // Update totalAmount (subtract refund from total)
      order.totalAmount -= item.refundAmount;

      // Update payment status
      if (totalRefund === 0) {
        order.paymentStatus = 'paid'; // Or keep as is
      } else if (totalRefund >= order.totalAmount + item.refundAmount) {
        // Original totalAmount before subtraction
        order.paymentStatus = 'refunded';
      } else {
        order.paymentStatus = 'partially_refunded';
      }
    }

    // Save order changes
    await order.save();

    return res
      .status(200)
      .json({ message: `Return request ${action}ed successfully.`, order });
  } catch (error) {
    console.error('Error handling return request:', error);
    return res
      .status(500)
      .json({ message: 'Server error.', error: error.message });
  }
};

export default {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrderItems,
  return_refundOrder,
  handleReturnRequest,
};
