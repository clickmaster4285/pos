// controllers/product.controller.js
import Product from '../models/product.model.js'
import Category from '../models/category.model.js';
import Ingredient from '../models/ingredient.model.js';
import Vendor from '../models/vendor.model.js';
import Company from '../models/company.model.js';
import { generateSKU } from '../utils/generateUniqueSKU.js';
import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';

const sanitize = (input) => {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
};

const getFeatures = async (companyId) => {
  const company = await Company.findOne({ companyId, isActive: true, deleted: false }).lean();
  if (!company) throw new Error('Company not found');
  const plan = company.plan?.find(p => p.isActive);
  return {
    hasVendors: plan?.limitations?.features?.includes('Vendors') || false,
    hasCategories: plan?.limitations?.features?.includes('Category') || false,
  };
};

const createProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const features = await getFeatures(companyId);

    const {
      productName,
      category,
      subCategoryName,
      vendor,
      sellingPrice,
      costPrice = 0,
      quantity = 0,
      description,
      tags = [],
      SKU,
      ingredient = [], // Added
    } = req.body;

    if (!productName || !sellingPrice ) {
      return res.status(400).json({ success: false, message: 'productName, sellingPrice are required' });
    }

    const cleanName = sanitize(productName);
    const cleanDesc = sanitize(description);
    const cleanTags = Array.isArray(tags) ? tags.map(sanitize) : [];

    // Validate category
    let categoryDoc = null;
    if (features.hasCategories && category) {
      categoryDoc = await Category.findOne({ _id: category, companyId, deleted: false });
      if (!categoryDoc) return res.status(400).json({ success: false, message: 'Invalid category' });
      if (subCategoryName && !categoryDoc.subCategory.includes(subCategoryName)) {
        return res.status(400).json({ success: false, message: 'Invalid subCategoryName' });
      }
    }

    // Validate vendor (optional)
    if (features.hasVendors && vendor) {
      const ven = await Vendor.findOne({ _id: vendor, companyId, deleted: false });
      if (!ven) return res.status(400).json({ success: false, message: 'Invalid vendor' });
    }

    // Validate ingredients
    if (ingredient.length > 0) {
      const validIngredients = await Ingredient.find({ _id: { $in: ingredient }, companyId, deleted: false });
      if (validIngredients.length !== ingredient.length) {
        return res.status(400).json({ success: false, message: 'One or more ingredients are invalid' });
      }
    }

    // SKU
    let finalSKU = SKU ? sanitize(SKU).toUpperCase() : null;
    if (!finalSKU) {
      [finalSKU] = await generateSKU('PROD', companyId, 1);
    } else {
      const exists = await Product.findOne({ SKU: finalSKU, companyId, deleted: false });
      if (exists) return res.status(400).json({ success: false, message: 'SKU already in use' });
    }
    const product = new Product({
      companyId,
      productName: cleanName,
      SKU: finalSKU,
      description: cleanDesc,
      tags: cleanTags,
      category: features.hasCategories ? categoryDoc.categoryName : null,
      subCategoryName: subCategoryName || null,
      vendor: features.hasVendors ? vendor : null,
      ingredient: ingredient || [],
      sellingPrice,
      costPrice,
      quantity,
      createdBy: userId,
      history: [{ action: 'CREATED', performedBy: userId, details: `Created by ${userId}` }],
    });

    await product.save();
    const populated = await Product.findById(product._id)
      .populate('ingredient', 'ingredientName')
      .lean();
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { companyId } = req.user;

    const products = await Product.find({ companyId, deleted: false })
      .sort({ createdAt: -1 })
      .lean();

    // Collect all ingredient IDs across products
    const allIngredientIds = [
      ...new Set(products.flatMap((p) => p.ingredient || [])),
    ];

    // Fetch ingredient names
    const ingredients = await Ingredient.find({ _id: { $in: allIngredientIds } })
      .select("name")
      .lean();

    const ingredientMap = Object.fromEntries(
      ingredients.map((ing) => [ing._id.toString(), ing.name])
    );

    // Replace ingredient IDs with names
    const populatedProducts = products.map((p) => ({
      ...p,
      ingredient: (p.ingredient || []).map((id) => ({
        // _id: id,
        name: ingredientMap[id] || "Unknown",
      })),
    }));
// console.log("the populatedProducts: ",JSON.stringify(populatedProducts))
    res.status(200).json({ success: true, data: populatedProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const getProductById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const product = await Product.findOne({ _id: id, companyId, deleted: false })
      .lean();

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const features = await getFeatures(companyId);
    const updates = req.body;

    const product = await Product.findOne({ _id: id, companyId, deleted: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Validate category
    if (features.hasCategories && updates.category) {
      const cat = await Category.findOne({ _id: updates.category, companyId, deleted: false });
      if (!cat) return res.status(400).json({ success: false, message: 'Invalid category' });
      if (updates.subCategoryName && !cat.subCategory.includes(updates.subCategoryName)) {
        return res.status(400).json({ success: false, message: 'Invalid subCategoryName' });
      }
    }

    // Validate vendor (optional)
    if (features.hasVendors && updates.vendor) {
      const ven = await Vendor.findOne({ _id: updates.vendor, companyId, deleted: false });
      if (!ven) return res.status(400).json({ success: false, message: 'Invalid vendor' });
    }

    // Validate ingredients
    if (updates.ingredient && updates.ingredient.length > 0) {
      const validIngredients = await Ingredient.find({ _id: { $in: updates.ingredient }, companyId, deleted: false });
      if (validIngredients.length !== updates.ingredient.length) {
        return res.status(400).json({ success: false, message: 'One or more ingredients are invalid' });
      }
    }

    Object.keys(updates).forEach(key => {
      if (key === 'tags') product[key] = Array.isArray(updates[key]) ? updates[key].map(sanitize) : [];
      else if (['productName', 'description', 'subCategoryName'].includes(key)) product[key] = sanitize(updates[key]);
      else if (!['companyId', 'createdBy', 'history', 'deleted'].includes(key)) product[key] = updates[key];
    });

    product.history.push({ action: 'UPDATED', performedBy: userId, details: `Updated by ${userId}` });
    product.updatedAt = new Date();

    await product.save();
    const populated = await Product.findById(product._id)
      .populate('ingredient', 'ingredientName')
      .lean();
    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const product = await Product.findOne({ _id: id, companyId, deleted: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.deleted = true;
    product.history.push({ action: 'DELETED', performedBy: userId });
    await product.save();

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleProductStatus = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const product = await Product.findOne({ _id: id, companyId, deleted: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isActive = !product.isActive;
    product.history.push({
      action: product.isActive ? 'ACTIVATED' : 'DEACTIVATED',
      performedBy: userId,
    });
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProductStock = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { stockData } = req.body;

    if (!Array.isArray(stockData) || stockData.length === 0) {
      return res.status(400).json({ success: false, message: 'stockData must be non-empty array' });
    }

    const results = [];
    for (const { productId, quantity } of stockData) {
      if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity)) {
        return res.status(400).json({ success: false, message: 'Invalid productId or quantity' });
      }

      const product = await Product.findOne({ _id: productId, companyId, deleted: false });
      if (!product) return res.status(404).json({ success: false, message: `Product ${productId} not found` });

      if (!product.isActive) return res.status(400).json({ success: false, message: 'Cannot update inactive product' });

      product.quantity = Math.max(0, (product.quantity || 0) + quantity);
      product.history.push({ action: 'STOCK_UPDATED', performedBy: userId, details: `+${quantity}` });
      await product.save();
      results.push(product);
    }

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Query too short' });
    }

    const sanitized = sanitize(query);
    const skip = (page - 1) * limit;

    const search = {
      companyId,
      deleted: false,
      $or: [
        { productName: { $regex: sanitized, $options: 'i' } },
        { SKU: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } },
      ],
    };

    const [data, total] = await Promise.all([
      Product.find(search).skip(skip).limit(+limit).lean(),
      Product.countDocuments(search),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  createProduct,
  getAllProducts,
  getProductById, 
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateProductStock,
  searchProducts,
};