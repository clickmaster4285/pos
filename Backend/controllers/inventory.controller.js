import { generateSKU } from "../utils/generateUniqueSKU.js";
import { generateUniqueSourceId } from "../utils/generateUniqueSourceId.js";
import IndexModel from "../models/indexModel.js";
import mongoose from 'mongoose';

class InventoryError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'InventoryError';
  }
}

// Utility function to compute deltas for changes
const computeDelta = (previous, newData) => {
  const delta = {};
  for (const key in newData) {
    if (JSON.stringify(previous[key]) !== JSON.stringify(newData[key])) {
      delta[key] = { previous: previous[key], new: newData[key] };
    }
  }
  if (previous.variants && newData.variants) {
    delta.variants = {};
    newData.variants.forEach((newV, i) => {
      const prevV = previous.variants.find(v => v._id.toString() === newV._id.toString());
      if (prevV && JSON.stringify(prevV) !== JSON.stringify(newV)) {
        delta.variants[newV.variantName] = computeDelta(prevV, newV);
      }
    });
  }
  return delta;
};

// Utility function to validate variant input
const validateVariantInput = (variant, includeQuantity = true) => {
  const errors = [];
  if (!variant.variantName || typeof variant.variantName !== 'string' || variant.variantName.length > 100) {
    errors.push('variantName must be a non-empty string (max 100 chars)');
  }
  if (includeQuantity && (variant.incomingQuantity === undefined || !Number.isInteger(variant.incomingQuantity) || variant.incomingQuantity < 0)) {
    errors.push('variant incoming quantity must be a non-negative integer');
  }
  if (variant.price !== undefined && (typeof variant.price !== 'number' || variant.price < 0)) {
    errors.push('variant price must be a non-negative number');
  }
  if (variant.costPrice !== undefined && (typeof variant.costPrice !== 'number' || variant.costPrice < 0)) {
    errors.push('variant costPrice must be a non-negative number');
  }
  if (variant.attributes && typeof variant.attributes !== 'object') {
    errors.push('variant attributes must be an object');
  }
  return errors;
};

// Utility function to validate inventory creation input
const validateCreateInput = (data) => {
  const { itemName, itemType, price, costPrice, vendor, variants, source } = data;
  const errors = [];

  if (!itemName || typeof itemName !== 'string' || itemName.length > 200) {
    errors.push('itemName must be a non-empty string (max 200 chars)');
  }
  if (!itemType || !['Part', 'Whole', 'Other'].includes(itemType)) {
    errors.push('itemType must be Part, Whole, or Other');
  }
  if (!vendor || !mongoose.isValidObjectId(vendor)) {
    errors.push('vendor must be a valid ObjectId');
  }
  if (data.description && (typeof data.description !== 'string' || data.description.length > 1000)) {
    errors.push('description must be a string (max 1000 chars)');
  }
  if (data.location && (typeof data.location !== 'string' || data.location.length > 100)) {
    errors.push('location must be a string (max 100 chars)');
  }
  if (data.source && (typeof data.source !== 'string' || data.source.length > 200)) {
    errors.push('source must be a string (max 200 chars)');
  }
  if (variants && !Array.isArray(variants)) {
    errors.push('variants must be an array');
  } else if (variants) {
    variants.forEach((variant, index) => {
      const variantErrors = validateVariantInput(variant);
      if (variantErrors.length > 0) {
        errors.push(`Variant ${index + 1}: ${variantErrors.join(', ')}`);
      }
    });
  }

  if (errors.length > 0) {
    throw new InventoryError(`Validation failed: ${errors.join(', ')}`);
  }
};

// Utility function to validate inventory update input
const validateUpdateInput = (data, includeQuantity = true) => {
  const { itemName, itemType, price, costPrice, vendor, description, location, variants, source } = data;
  const errors = [];
  const hasFields = Object.keys(data).length > 0;
  if (!hasFields) {
    errors.push('At least one field must be provided for update');
  }
  if (itemName && (typeof itemName !== 'string' || itemName.length > 200)) {
    errors.push('itemName must be a non-empty string (max 200 chars)');
  }
  if (itemType && !['Part', 'Whole', 'Other'].includes(itemType)) {
    errors.push('itemType must be Part, Whole, or Other');
  }
  if (vendor && !mongoose.isValidObjectId(vendor)) {
    errors.push('vendor must be a valid ObjectId');
  }
  if (description && (typeof description !== 'string' || description.length > 1000)) {
    errors.push('description must be a string (max 1000 chars)');
  }
  if (location && (typeof location !== 'string' || location.length > 100)) {
    errors.push('location must be a string (max 100 chars)');
  }
  if (source && (typeof source !== 'string' || source.length > 200)) {
    errors.push('source must be a string (max 200 chars)');
  }
  if (variants && !Array.isArray(variants)) {
    errors.push('variants must be an array');
  } else if (variants) {
    variants.forEach((variant, index) => {
      const variantErrors = validateVariantInput(variant, includeQuantity);
      if (variantErrors.length > 0) {
        errors.push(`Variant ${index + 1}: ${variantErrors.join(', ')}`);
      }
    });
  }

  if (errors.length > 0) {
    throw new InventoryError(`Validation failed: ${errors.join(', ')}`);
  }
};

// Utility function to check vendor existence
const checkVendor = async (vendorId, companyId) => {
  const vendor = await IndexModel.Vendor.findOne({
    _id: vendorId,
    deleted: false,
    isActive: true,
    companyId,
  });
  if (!vendor) {
    throw new InventoryError('Vendor not found or inactive', 404);
  }
  return vendor;
};

// Utility function to create history entry
const createHistoryEntry = async (action, performedBy, previousData, newData, reason = '', source = '', comments = '', variantId = null, relatedHistoryId = null) => {
  const changes = computeDelta(previousData, newData);
  const historyEntry = new IndexModel.History({
    action,
    performedBy,
    reason,
    source,
    comments,
    changes,
    variantId,
    relatedHistoryId,
    previousData: {
      ...previousData,
      variants: previousData.variants || [],
    },
    newData: {
      ...newData,
      variants: newData.variants || [],
    },
    createdAt: new Date(),
  });
  await historyEntry.save();
  return historyEntry;
};

// Create a new inventory item
const createInventory = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const data = req.body;

    // Validate input
    validateCreateInput(data);

    const { itemName, itemType, description, vendor, location, variants = [], reason, comments } = data;

    // Check vendor
    await checkVendor(vendor, companyId);

    // Check for existing inventory item
    const existingInventory = await IndexModel.Inventory.findOne({
      itemName,
      deleted: false,
      isActive: true,
      companyId,
    });

    if (existingInventory) {
      throw new InventoryError('Inventory item with this name already exists', 400);
    }

    // Generate unique sourceId if not provided
    const sourceId = await generateUniqueSourceId('PURCHASE', companyId);

    // Generate unique SKUs for all variants
    // con
    const skus = await generateSKU(itemType, companyId, variants.length);

    // Assign SKUs to variants
    const variantData = variants.map((variant, index) => ({
      ...variant,
      sku: skus[index], // Assign unique SKU from the batch
      quantity: variant.incomingQuantity || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Create new inventory item
    const inventoryItem = new IndexModel.Inventory({
      itemName,
      itemType,
      description,
      companyId,
      vendor,
      location,
      createdBy: userId,
      isActive: true,
      variants: variantData,
      history: [{ action: 'created', performedBy: userId, createdAt: new Date() }],
    });

    // console.log("teh inventoryItem was is int : ", inventoryItem)
    await inventoryItem.save();

    // Create detailed history entry
    await createHistoryEntry(
      'created',
      userId,
      {},
      inventoryItem.toObject(),
      reason,
      sourceId,
      comments
    );

    // Update company inventory count
    const company = await IndexModel.Company.findOneAndUpdate(
      { companyId },
      {
        $inc: { 'gain.inventory': 1 },
        $push: {
          history: {
            action: `Inventory created ${inventoryItem._id}`,
            performedBy: userId,
            createdAt: new Date(),
          },
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!company) {
      await IndexModel.Inventory.deleteOne({ _id: inventoryItem._id });
      await IndexModel.History.deleteMany({ 'newData._id': inventoryItem._id });
      throw new InventoryError('Company not found. Inventory creation rolled back.', 404);
    }
    return res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      inventoryItem,
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Add stock to an existing inventory item
const addStock = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    const { variants, reason, source, comments } = req.body;

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      throw new InventoryError('Variants array is required and must not be empty', 400);
    }
// console.log("the variants are : ", variants)
    variants.forEach((variant, index) => {
      const errors = validateVariantInput(variant);
      if (errors.length > 0) {
        throw new InventoryError(`Validation failed: Variant ${index + 1}: ${errors.join(', ')}`, 400);
      }
    });

    const inventoryItem = await IndexModel.Inventory.findOne({
      _id: id,
      isActive: true,
      deleted: false,
      companyId,
    });

    if (!inventoryItem) {
      throw new InventoryError('Inventory item not found', 404);
    }

    const prevData = inventoryItem.toObject();

    // Generate unique sourceId if not provided
    const sourceId = source || await generateUniqueSourceId('PURCHASE', companyId);

    // Count new variants needing SKUs (those without provided sku)
    const newVariants = variants.filter((variant) => !variant.sku);
    const skus = await generateSKU(inventoryItem.itemType, companyId, newVariants.length);

    let skuIndex = 0; // Track which SKU to assign from the batch
    const variantData = variants.map((variant) => ({
      ...variant,
      sku: variant.sku || skus[skuIndex++], // Use provided SKU or next from batch
    }));

    const updatedVariants = [...inventoryItem.variants];

    variantData.forEach((newVariant) => {
      const existingVariantIndex = updatedVariants.findIndex(
        (v) => v.variantName === newVariant.variantName
      );

      if (existingVariantIndex !== -1) {
        updatedVariants[existingVariantIndex].quantity += newVariant.incomingQuantity;
        updatedVariants[existingVariantIndex].incomingQuantity = newVariant.incomingQuantity;
        updatedVariants[existingVariantIndex].price = newVariant.price || updatedVariants[existingVariantIndex].price;
        updatedVariants[existingVariantIndex].costPrice = newVariant.costPrice || updatedVariants[existingVariantIndex].costPrice;
        updatedVariants[existingVariantIndex].attributes = newVariant.attributes || updatedVariants[existingVariantIndex].attributes;
        updatedVariants[existingVariantIndex].updatedAt = new Date();
      } else {
        updatedVariants.push({
          ...newVariant,
          quantity: newVariant.incomingQuantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });

    inventoryItem.variants = updatedVariants;
    inventoryItem.updatedBy = userId;
    inventoryItem.updatedAt = new Date();
    inventoryItem.history.push({
      action: 'stock_added',
      performedBy: userId,
      createdAt: new Date(),
    });

    await inventoryItem.save();

    await createHistoryEntry(
      'stock_added',
      userId,
      prevData,
      inventoryItem.toObject(),
      reason,
      sourceId,
      comments
    );

    return res.status(200).json({
      success: true,
      message: 'Stock added successfully',
      inventoryItem,
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Update inventory item information (non-stock fields)
const updateInfo = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    const data = req.body;

    // Ignore stock-related fields
    const { variants, quantity, incomingQuantity, totalVariants, reason, source, comments, ...otherFields } = data;

    validateUpdateInput(otherFields, false);

    const inventoryItem = await IndexModel.Inventory.findOne({
      _id: id,
      isActive: true,
      deleted: false,
      companyId,
    });

    if (!inventoryItem) {
      throw new InventoryError('Inventory item not found', 404);
    }

    const prevData = inventoryItem.toObject();

    // Generate unique sourceId if not provided
    const sourceId = source || await generateUniqueSourceId('UPDATE', companyId);

    Object.assign(inventoryItem, otherFields);
    inventoryItem.updatedBy = userId;
    inventoryItem.updatedAt = new Date();
    inventoryItem.history.push({
      action: 'info_updated',
      performedBy: userId,
      createdAt: new Date(),
    });

    await inventoryItem.save();

    await createHistoryEntry(
      'info_updated',
      userId,
      prevData,
      inventoryItem.toObject(),
      reason,
      sourceId,
      comments
    );

    return res.status(200).json({
      success: true,
      message: 'Inventory info updated successfully',
      inventoryItem,
    });
  } catch (error) {
    console.error('Error updating inventory info:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Get all active inventory items
const getAllInventoryItems = async (req, res) => {
  try {
    const { companyId } = req.user;

    const inventoryItems = await IndexModel.Inventory.find({
      companyId,
      isActive: true,
      deleted: false,
    }).sort({ createdAt: -1 });

    // Collect all vendorIds from inventory
    const vendorIds = inventoryItems.map(item => item.vendor);

    const vendors = await IndexModel.Vendor.find({
      _id: { $in: vendorIds },
      companyId,
      deleted: false,
    }).select('name email phone');

    // Convert vendors to map for quick lookup
    const vendorMap = {};
    vendors.forEach(v => {
      vendorMap[v._id.toString()] = v;
    });

    // Merge vendor info into inventory items
    const data = inventoryItems.map(item => ({
      ...item.toObject(),
      vendor: vendorMap[item.vendor?.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      message: 'Inventory items retrieved successfully',
      inventoryItems: data,
    });
  } catch (error) {
    console.error('Error retrieving inventory items:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Modified getInventoryItemById for clearer historySummary
const getInventoryItemById = async (req, res) => {
  try {
    
    const { companyId } = req.user;
    const { id } = req.params;

    const inventoryItem = await IndexModel.Inventory.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!inventoryItem) {
      throw new InventoryError('Inventory item not found', 404);
    }

    // Fetch all related histories, sorted chronologically
    const histories = await IndexModel.History.find({
      $or: [
        { 'previousData._id': inventoryItem._id },
        { 'newData._id': inventoryItem._id },
      ],
    }).sort({ createdAt: 1 });

    // Build a clear, variant-focused history summary
    const historySummary = histories.map((h, index) => {
      const prevQty = h.previousData?.quantity || 0;
      const newQty = h.newData?.quantity || 0;
      const change = newQty - prevQty;

      // Compute variant-specific changes
      const variantChanges = [];
      if (h.newData?.variants && h.previousData?.variants) {
        h.newData.variants.forEach(newV => {
          const prevV = h.previousData.variants.find(pv => pv._id.toString() === newV._id.toString());
          const prevVarQty = prevV?.quantity || 0;
          const newVarQty = newV.quantity || 0;
          const varChange = newVarQty - prevVarQty;
          if (varChange !== 0 || h.action === 'created') {
            variantChanges.push({
              variantName: newV.variantName,
              variantId: newV._id.toString(),
              previousQuantity: prevVarQty,
              newQuantity: newVarQty,
              change: varChange,
            });
          }
        });
      }

      let description = '';
      if (h.action === 'created') {
        description = `Initial stock set to ${newQty} units (${h.newData.variants
          .map(v => `${v.variantName}: ${v.quantity}`)
          .join(', ')})`;
      } else if (h.action.includes('stock_added')) {
        description = `Added stock: ${variantChanges
          .map(vc => `${vc.change} units to ${vc.variantName} (from ${vc.previousQuantity} to ${vc.newQuantity})`)
          .join(', ')}`;
      } else if (h.action.includes('history_updated')) {
        description = `Updated history ${h._id.toString()}: ${variantChanges
          .map(vc => `${vc.variantName} from ${vc.previousQuantity} to ${vc.newQuantity} (change ${vc.change >= 0 ? '+' : ''}${vc.change})`)
          .join(', ')}`;
      } else if (h.action.includes('Adjusted to maintain sequence')) {
        description = `Propagated update from history ${h.newData.history.find(h => h.action.includes('Updated from history'))?.action.split(' ').pop() || 'unknown'}: Total quantity adjusted to ${newQty}`;
      } else if (h.action.includes('deleted')) {
        description = `Item/Variant deleted (quantity at deletion: ${prevQty})`;
      } else {
        description = `Quantity changed from ${prevQty} to ${newQty} (${variantChanges
          .map(vc => `${vc.variantName}: ${vc.previousQuantity} to ${vc.newQuantity}`)
          .join(', ')})`;
      }

      return {
        sequence: index + 1,
        action: h.action,
        performedBy: h.performedBy,
        createdAt: h.createdAt,
        description,
        reason: h.reason || 'N/A',
        source: h.source || 'N/A',
        comments: h.comments || 'N/A',
        variantChanges, // Detailed changes per variant
        id: h._id.toString(),
      };
    });

    return res.status(200).json({
      success: true,
      inventoryItem,
      historySummary,
    });
  } catch (error) {
    console.error('Error getting inventory item:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Update inventory item via history
const updateInventoryItem = async (req, res) => {
  try {
    const { inventoryId, historyId } = req.params;
    const { variants, reason, comments } = req.body;
    const { userId, companyId } = req.user;
    const sourceId = generateUniqueSourceId();

    const inventoryItem = await IndexModel.Inventory.findOne({
      _id: inventoryId,
      companyId,
      deleted: false,
      isActive: true,
    });

    if (!inventoryItem) {
      throw new InventoryError('Inventory item not found or inactive', 404);
    }

    const histories = await IndexModel.History.find({
      'newData.id': inventoryId,
    }).sort({ createdAt: 1 });

    const targetHistory = histories.find(h => h._id.toString() === historyId);
    if (!targetHistory) {
      throw new InventoryError('History record not found', 404);
    }

    const targetIndex = histories.findIndex(h => h._id.toString() === historyId);
    if (targetIndex === -1) {
      throw new InventoryError('History record not found in inventory history', 404);
    }

    if (targetHistory.action.includes('deleted')) {
      throw new InventoryError('Cannot update a deleted history record', 403);
    }

    const prevData = inventoryItem.toObject();
    const variantDiffs = {};

    if (variants) {
      validateVariantInput(variants, true);
      variants.forEach(newVariant => {
        const vid = newVariant.variantId;
        if (!vid) {
          throw new InventoryError('variantId is required for variant updates', 400);
        }

        const targetVariant = targetHistory.newData.variants.find(v => v._id.toString() === vid);
        if (!targetVariant) {
          throw new InventoryError(`Variant ${vid} not found in this history record`, 404);
        }

        const oldIncoming = targetVariant.incomingQuantity || 0;
        const newIncoming = newVariant.incomingQuantity !== undefined ? newVariant.incomingQuantity : oldIncoming;
        const vdiff = newIncoming - oldIncoming;
        variantDiffs[vid] = vdiff;

        if (targetHistory.newData.quantity + vdiff < 0) {
          throw new InventoryError('Update would result in negative quantity', 400);
        }

        targetVariant.incomingQuantity = newIncoming;
        targetVariant.quantity = (targetHistory.previousData.variants.find(v => v._id.toString() === vid)?.quantity || 0) + newIncoming;
        if (newVariant.price !== undefined) targetVariant.price = newVariant.price;
        if (newVariant.costPrice !== undefined) targetVariant.costPrice = newVariant.costPrice;
        if (newVariant.attributes) targetVariant.attributes = newVariant.attributes;
        if (newVariant.sku) targetVariant.sku = newVariant.sku;
        targetVariant.updatedAt = new Date();
      });
    }

    // Recalculate quantities
    targetHistory.newData.quantity = targetHistory.newData.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
    targetHistory.newData.incomingQuantity = targetHistory.newData.variants.reduce((sum, v) => sum + (v.incomingQuantity || 0), 0);
    targetHistory.newData.totalVariants = targetHistory.newData.variants.length;

    // Recalculate totalPrice and totalCostPrice
    targetHistory.newData.totalPrice = targetHistory.newData.variants.reduce((sum, v) => sum + ((v.price || 0) * (v.quantity || 0)), 0);
    targetHistory.newData.totalCostPrice = targetHistory.newData.variants.reduce((sum, v) => sum + ((v.costPrice || 0) * (v.quantity || 0)), 0);

    targetHistory.action = `Inventory updated: qty ${targetHistory.previousData.quantity || 0} → ${targetHistory.newData.quantity}`;
    targetHistory.reason = reason || targetHistory.reason;
    targetHistory.source = sourceId;
    targetHistory.changes = computeDelta(targetHistory.previousData, targetHistory.newData);
    targetHistory.updatedBy = userId;
    targetHistory.updatedAt = new Date();
    await targetHistory.save();

    // Propagate changes to subsequent histories
    for (let i = targetIndex + 1; i < histories.length; i++) {
      const history = histories[i];
      for (const [vid, vdiff] of Object.entries(variantDiffs)) {
        const prevV = history.previousData.variants.find(v => v._id.toString() === vid);
        if (prevV) prevV.quantity = (prevV.quantity || 0) + vdiff;
        const newV = history.newData.variants.find(v => v._id.toString() === vid);
        if (newV) newV.quantity = (newV.quantity || 0) + vdiff;
      }

      history.previousData.quantity = history.previousData.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
      history.newData.quantity = history.newData.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
      history.previousData.incomingQuantity = history.previousData.variants.reduce((sum, v) => sum + (v.incomingQuantity || 0), 0);
      history.newData.incomingQuantity = history.newData.variants.reduce((sum, v) => sum + (v.incomingQuantity || 0), 0);
      history.previousData.totalVariants = history.previousData.variants.length;
      history.newData.totalVariants = history.newData.variants.length;
      // Recalculate totalPrice and totalCostPrice for subsequent histories
      history.previousData.totalPrice = history.previousData.variants.reduce((sum, v) => sum + ((v.price || 0) * (v.quantity || 0)), 0);
      history.newData.totalPrice = history.newData.variants.reduce((sum, v) => sum + ((v.price || 0) * (v.quantity || 0)), 0);
      history.previousData.totalCostPrice = history.previousData.variants.reduce((sum, v) => sum + ((v.costPrice || 0) * (v.quantity || 0)), 0);
      history.newData.totalCostPrice = history.newData.variants.reduce((sum, v) => sum + ((v.costPrice || 0) * (v.quantity || 0)), 0);
      history.changes = computeDelta(history.previousData, history.newData);
      history.action = `Propagated update from history ${historyId}`;
      history.updatedBy = userId;
      history.updatedAt = new Date();
      await history.save();
    }

    // Update the main inventory document
    const lastHistory = histories[histories.length - 1] || targetHistory;
    inventoryItem.quantity = lastHistory.newData.quantity;
    inventoryItem.incomingQuantity = lastHistory.newData.incomingQuantity;
    inventoryItem.totalVariants = lastHistory.newData.totalVariants;
    inventoryItem.totalPrice = lastHistory.newData.totalPrice;
    inventoryItem.totalCostPrice = lastHistory.newData.totalCostPrice;
    inventoryItem.variants = lastHistory.newData.variants.map(v => ({ ...v }));
    inventoryItem.updatedAt = new Date();
    inventoryItem.updatedBy = userId;
    inventoryItem.history.push({
      action: `Updated from history ${historyId}`,
      performedBy: userId,
      createdAt: new Date(),
    });

    await inventoryItem.save();

    await createHistoryEntry(
      'history_updated',
      userId,
      prevData,
      inventoryItem.toObject(),
      reason,
      sourceId,
      comments,
      null,
      historyId
    );

    return res.status(200).json({
      success: true,
      message: 'Inventory and history updated successfully',
      inventoryItem,
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// // Soft delete an inventory item, variant, or history
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;          // inventoryId
    const { userId, companyId } = req.user;

    // 1. Find the inventory item
    const inventoryItem = await IndexModel.Inventory.findOne({
      _id: id,
      companyId,
      deleted: false,
      isActive: true,
    });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found or already deleted',
      });
    }

    // 2. Mark as soft deleted
    inventoryItem.deleted = true;
    inventoryItem.isActive = false;

    // 3. Push into history
    inventoryItem.history.push({
      action: "deleted",
      performedBy: userId,
      createdAt: new Date(),
    });

    await inventoryItem.save();

    return res.status(200).json({
      success: true,
      message: 'Inventory item soft deleted successfully',
      data: inventoryItem,
    });
  } catch (error) {
    console.error('Error soft-deleting inventory:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};


export default {
  createInventory,
  addStock,
  updateInfo,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
};