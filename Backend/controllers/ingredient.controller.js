// controllers/ingredient.controller.js
import Ingredient from '../models/ingredient.model.js';
import { generateSKU } from '../utils/generateUniqueSKU.js';
import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';

const sanitize = (input) => typeof input === 'string' ? sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim() : input;

const createIngredient = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const {
      name,
      category,
      unit,
      costPerUnit,
      supplier,
      storage,
      expiryDate,
      currentStock = 0,
      SKU,
      // any extra dynamic fields come in the body root
      ...dynamicFields
    } = req.body;
      // console.log("th e req.user is ", req.body)

    // ---- required core fields -------------------------------------------------
    if (!name || !category || !unit || costPerUnit === undefined ) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // ---- SKU -----------------------------------------------------------------
    let finalSKU = SKU ? sanitize(SKU).toUpperCase() : null;
    if (!finalSKU) {
      [finalSKU] = await generateSKU('ING', companyId, 1);
    } else {
      const exists = await Ingredient.findOne({
        SKU: finalSKU,
        companyId,
        deleted: false,
      });
      if (exists)
        return res
      .status(400)
      .json({ success: false, message: 'SKU already in use' });
    }
    
    // ---- supplier (optional) --------------------------------------------------
    const cleanSupplier = supplier
    ? {
      name: sanitize(supplier.name),
      contact: sanitize(supplier.contact),
      leadTime: supplier.leadTime,
    }
    : null;
    // ---- build ingredient -----------------------------------------------------
    console.log("th e req.body is ", companyId, sanitize(name), finalSKU, category,
      unit,
      costPerUnit,
      currentStock,cleanSupplier,
storage,
expiryDate,
dynamicFields,)
    const ingredient = new Ingredient({
      companyId,
      name: sanitize(name),
      SKU: finalSKU,
      category,
      unit,
      costPerUnit,
      currentStock,
      supplier: cleanSupplier,
      storage: storage || 'room',
      expiryDate: expiryDate || null,
      metaData: dynamicFields,               // <-- dynamic fields go here
      createdBy: userId,
      history: [{ action: 'CREATED', performedBy: userId }],
    });

    await ingredient.save();
    res.status(201).json({ success: true, data: ingredient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllIngredients = async (req, res) => {
  try {
    const { companyId } = req.user;
    const ingredients = await Ingredient.find({ companyId, deleted: false }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: ingredients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getIngredientById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const ingredient = await Ingredient.findOne({ _id: id, companyId, deleted: false }).lean();
    if (!ingredient) return res.status(404).json({ success: false, message: 'Not found' });

    res.status(200).json({ success: true, data: ingredient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateIngredient = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid ingredient ID' });

    const ingredient = await Ingredient.findOne({
      _id: id,
      companyId,
      deleted: false,
    });
    if (!ingredient)
      return res
        .status(404)
        .json({ success: false, message: 'Ingredient not found' });

    const {
      name,
      SKU,
      category,
      unit,
      costPerUnit,
      supplier,
      storage,
      expiryDate,
      currentStock,
      minStockLevel,
      isActive,
      // everything else is a dynamic field
      ...dynamicUpdates
    } = req.body;

    // ---- core fields ---------------------------------------------------------
    if (name !== undefined) ingredient.name = sanitize(name);
    if (SKU !== undefined) ingredient.SKU = sanitize(SKU).toUpperCase();
    if (category !== undefined) ingredient.category = category;
    if (unit !== undefined) ingredient.unit = unit;
    if (costPerUnit !== undefined) ingredient.costPerUnit = costPerUnit;
    if (currentStock !== undefined) ingredient.currentStock = currentStock;
    if (minStockLevel !== undefined) ingredient.minStockLevel = minStockLevel;
    if (storage !== undefined) ingredient.storage = storage;
    if (expiryDate !== undefined) ingredient.expiryDate = expiryDate || null;
    if (isActive !== undefined) ingredient.isActive = isActive;

    // ---- supplier ------------------------------------------------------------
    if (supplier !== undefined) {
      ingredient.supplier = supplier
        ? {
            name: sanitize(supplier.name),
            contact: sanitize(supplier.contact),
            leadTime: supplier.leadTime,
          }
        : null;
    }

    // ---- dynamic fields (metaData) -------------------------------------------
    ingredient.metaData = { ...ingredient.metaData, ...dynamicUpdates };

    // ---- audit ---------------------------------------------------------------
    ingredient.history.push({ action: 'UPDATED', performedBy: userId });

    await ingredient.save();
    res.status(200).json({ success: true, data: ingredient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteIngredient = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const ingredient = await Ingredient.findOne({ _id: id, companyId, deleted: false });
    if (!ingredient) return res.status(404).json({ success: false, message: 'Not found' });

    ingredient.deleted = true;
    ingredient.history.push({ action: 'DELETED', performedBy: userId });
    await ingredient.save();

    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleIngredientStatus = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const ingredient = await Ingredient.findOne({ _id: id, companyId, deleted: false });
    if (!ingredient) return res.status(404).json({ success: false, message: 'Not found' });

    ingredient.isActive = !ingredient.isActive;
    ingredient.history.push({
      action: ingredient.isActive ? 'ACTIVATED' : 'DEACTIVATED',
      performedBy: userId,
    });
    await ingredient.save();

    res.status(200).json({ success: true, data: ingredient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateIngredientStock = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { stockData } = req.body;

    if (!Array.isArray(stockData) || stockData.length === 0) {
      return res.status(400).json({ success: false, message: 'stockData required' });
    }

    const results = [];
    for (const { ingredientId, quantity } of stockData) {
      if (!mongoose.isValidObjectId(ingredientId) || !Number.isInteger(quantity)) {
        return res.status(400).json({ success: false, message: 'Invalid data' });
      }

      const ing = await Ingredient.findOne({ _id: ingredientId, companyId, deleted: false });
      if (!ing) return res.status(404).json({ success: false, message: `Ingredient ${ingredientId} not found` });

      ing.currentStock = Math.max(0, (ing.currentStock || 0) + quantity);
      ing.history.push({ action: 'STOCK_UPDATED', performedBy: userId, details: `+${quantity}` });
      await ing.save();
      results.push(ing);
    }

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export default {
  createIngredient,
  getAllIngredients,
  getIngredientById,
  updateIngredient,
  deleteIngredient,
  toggleIngredientStatus,
  updateIngredientStock,
};