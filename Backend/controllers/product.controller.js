// controllers/product.controller.js
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Ingredient from '../models/ingredient.model.js';
import Vendor from '../models/vendor.model.js';
import Company from '../models/company.model.js';
import { generateSKU } from '../utils/generateUniqueSKU.js';
import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import path from 'path';
import fs from 'fs';

const sanitize = (input) => {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
};

const getFeatures = async (companyId) => {
  const company = await Company.findOne({
    companyId,
    isActive: true,
    deleted: false,
  }).lean();
  if (!company) throw new Error('Company not found');
  const plan = company.plan?.find((p) => p.isActive);
  return {
    hasVendors: plan?.limitations?.features?.includes('Vendors') || false,
    hasCategories: plan?.limitations?.features?.includes('Category') || false,
  };
};

const getImageUrl = (filename) => {
  return filename ? `/Uploads/products/${filename}` : null;
};

const processIngredients = async (ingredients, companyId) => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return [];

  const ingredientIds = ingredients
    .map((ing) => ing.ingredientId)
    .filter((id) => mongoose.isValidObjectId(id));

  const validIngredients = await Ingredient.find({
    _id: { $in: ingredientIds },
    companyId,
    deleted: false,
  }).lean();

  const ingredientMap = new Map(
    validIngredients.map((ing) => [ing._id.toString(), ing])
  );

  return ingredients.map((ing) => {
    const validIng = ingredientMap.get(ing.ingredientId);
    if (!validIng) {
      throw new Error(`Invalid ingredient ID: ${ing.ingredientId}`);
    }
    return {
      ingredientId: validIng._id,
      ingredientName: validIng.ingredientName || ing.ingredientName,
      quantity: sanitize(ing.quantity || ''),
      unit: sanitize(ing.unit || 'unit'), // default fallback
    };
  });
};

/* ------------------------------------------------------------------ */
const createProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const features = await getFeatures(companyId);

    // ----- Parse tags (stringified array) -----
    let tags = [];
    try {
      tags = req.body.tags ? JSON.parse(req.body.tags) : [];
      if (!Array.isArray(tags)) tags = [];
    } catch (e) {
      console.log('Tags parse error:', e);
      return res
        .status(400)
        .json({ success: false, message: 'Invalid tags format' });
    }

    // ----- Parse ingredients (array of JSON strings) -----
    let ingredients = [];
    if (Array.isArray(req.body.ingredients)) {
      for (const ingStr of req.body.ingredients) {
        if (typeof ingStr !== 'string' || !ingStr.trim()) continue;
        try {
          const parsed = JSON.parse(ingStr);
          if (Array.isArray(parsed)) {
            ingredients.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            ingredients.push(parsed);
          }
        } catch (e) {
          console.log('Invalid ingredient JSON:', ingStr);
          return res.status(400).json({
            success: false,
            message: `Invalid ingredient JSON format: ${ingStr.substring(
              0,
              50
            )}...`,
          });
        }
      }
    } else if (
      typeof req.body.ingredients === 'string' &&
      req.body.ingredients.trim()
    ) {
      try {
        const parsed = JSON.parse(req.body.ingredients);
        ingredients = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid ingredients JSON string' });
      }
    }

    const {
      productName = '',
      category,
      subCategoryName,
      vendor,
      sellingPrice = 0,
      costPrice = 0,
      quantity = 0,
      description = '',
      SKU,
    } = req.body;

    // ----- Core required fields -----
    if (!productName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'productName is required' });
    }
    if (!sellingPrice || isNaN(sellingPrice)) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'sellingPrice is required and must be a number',
        });
    }

    // ----- Image handling -----
    let imgUrl = [];
    if (req.files && req.files.length > 0) {
      imgUrl = req.files.map((file) => getImageUrl(file.filename));
    }

    const cleanName = sanitize(productName);
    const cleanDesc = sanitize(description);
    const cleanTags = tags.map(sanitize);

    // ----- Category validation -----
    let categoryDoc = null;
    if (features.hasCategories && category) {
      categoryDoc = await Category.findOne({
        _id: category,
        companyId,
        deleted: false,
      });
      if (!categoryDoc)
        return res
          .status(400)
          .json({ success: false, message: 'Invalid category' });
      if (
        subCategoryName &&
        !categoryDoc.subCategory.includes(subCategoryName)
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid subCategoryName' });
      }
    }

    // ----- Vendor validation -----
    if (features.hasVendors && vendor) {
      const ven = await Vendor.findOne({
        _id: vendor,
        companyId,
        deleted: false,
      });
      if (!ven)
        return res
          .status(400)
          .json({ success: false, message: 'Invalid vendor' });
    }

    // ----- Process ingredients (with unit) -----
    const processedIngredients = await processIngredients(
      ingredients,
      companyId
    );
    // console.log("processedIngredients: ", processedIngredients);

    // ----- SKU handling -----
    let finalSKU = SKU ? sanitize(SKU).toUpperCase() : null;
    if (!finalSKU) {
      [finalSKU] = await generateSKU('PROD', companyId, 1);
    } else {
      const exists = await Product.findOne({
        SKU: finalSKU,
        companyId,
        deleted: false,
      });
      if (exists)
        return res
          .status(400)
          .json({ success: false, message: 'SKU already in use' });
    }

    // ----- Collect unknown fields into metaData -----
    const knownFields = new Set([
      'productName',
      'category',
      'subCategoryName',
      'vendor',
      'sellingPrice',
      'costPrice',
      'quantity',
      'description',
      'tags',
      'SKU',
      'ingredients',
      'productImage',
      'imgUrl',
    ]);

    const metaData = {};
    Object.keys(req.body).forEach((key) => {
      if (
        !knownFields.has(key) &&
        req.body[key] !== undefined &&
        req.body[key] !== '' &&
        req.body[key] !== null
      ) {
        metaData[key] = req.body[key];
      }
    });

    // ----- Create product -----
    const product = new Product({
      companyId,
      productName: cleanName,
      SKU: finalSKU,
      description: cleanDesc,
      tags: cleanTags,
      imgUrl,
      category: categoryDoc?._id || null,
      subCategoryName: subCategoryName || null,
      vendor: vendor || null,
      ingredient: processedIngredients,
      metaData,
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice),
      quantity: Number(quantity),
      createdBy: userId,
    });

    await product.save();

    const populated = await Product.findById(product._id)
      .populate('ingredient.ingredientId', 'ingredientName')
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
    const ingredients = await Ingredient.find({
      _id: { $in: allIngredientIds },
    })
      .select('name')
      .lean();

    const ingredientMap = Object.fromEntries(
      ingredients.map((ing) => [ing._id.toString(), ing.name])
    );

    // ===== VENDORS =====
    const vendorIds = [
      ...new Set(
        products
          .map((p) => p.vendor) // field name from your DB
          .filter(Boolean)
          .map((id) => id.toString())
      ),
    ];

    const vendors = vendorIds.length
      ? await Vendor.find({ _id: { $in: vendorIds } })
          .select('name') // or 'vendorName' if that's your field
          .lean()
      : [];

    const vendorMap = Object.fromEntries(
      vendors.map((v) => [v._id.toString(), v.name])
    );

   
    // ===== CATEGORIES =====
    const categoryIds = [
      ...new Set(
        products
          .map((p) => p.category) // "category" field from product
          .filter(Boolean)
          .map((id) => id.toString())
      ),
    ];

    const categories = categoryIds.length
      ? await Category.find({ _id: { $in: categoryIds } })
          .select('categoryName') // 👈 use the correct field
          .lean()
      : [];

    const categoryMap = Object.fromEntries(
      categories.map((c) => [c._id.toString(), c.categoryName]) // 👈 use categoryName
    );

    // Replace ingredient IDs with names
    const populatedProducts = products.map((p) => ({
      ...p,
      ingredient: (p.ingredient || []).map((id) => ({
        // _id: id,
        name: ingredientMap[id] || 'Unknown',
      })),
      vendorName: p.vendor ? vendorMap[p.vendor.toString()] || 'Unknown' : null,
      categoryName: p.category
        ? categoryMap[p.category.toString()] || 'Unknown'
        : null,
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
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: 'Invalid ID' });

    const product = await Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    }).lean();

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    const features = await getFeatures(companyId);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const product = await Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    // Handle image replacement
    if (req.files && req.files.length > 0) {
      if (product.imgUrl && product.imgUrl.length > 0) {
        product.imgUrl.forEach((url) => {
          const oldImagePath = path.join(
            process.cwd(),
            'Uploads',
            'products',
            path.basename(url)
          );
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        });
      }
      product.imgUrl = req.files.map((file) => getImageUrl(file.filename));
    }

    const {
      productName,
      category,
      subCategoryName,
      vendor,
      sellingPrice,
      costPrice,
      quantity: stockQuantity,
      description,
      tags,
      ingredients: rawIngredients,
      ...otherUpdates
    } = req.body;

    // === UPDATE metaData WITH UNKNOWN FIELDS ===
    const knownFields = new Set([
      'productName',
      'category',
      'subCategoryName',
      'vendor',
      'sellingPrice',
      'costPrice',
      'quantity',
      'description',
      'tags',
      'ingredients',
      'imgUrl',
      'productImage',
    ]);

    Object.keys(otherUpdates).forEach((key) => {
      if (!knownFields.has(key)) {
        if (
          otherUpdates[key] === '' ||
          otherUpdates[key] === null ||
          otherUpdates[key] === undefined
        ) {
          delete product.metaData[key];
        } else {
          product.metaData[key] = otherUpdates[key];
        }
      }
    });

    // === PARSE INGREDIENTS (array of JSON strings) ===
    let ingredients = [];
    if (rawIngredients !== undefined) {
      if (Array.isArray(rawIngredients)) {
        for (const ingStr of rawIngredients) {
          if (typeof ingStr !== 'string' || !ingStr.trim()) continue;
          try {
            const parsed = JSON.parse(ingStr);
            if (Array.isArray(parsed)) {
              ingredients.push(...parsed);
            } else if (parsed && typeof parsed === 'object') {
              ingredients.push(parsed);
            }
          } catch (e) {
            return res.status(400).json({
              success: false,
              message: `Invalid ingredient JSON: ${ingStr.substring(0, 50)}...`,
            });
          }
        }
      } else if (typeof rawIngredients === 'string' && rawIngredients.trim()) {
        try {
          const parsed = JSON.parse(rawIngredients);
          ingredients = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          return res
            .status(400)
            .json({
              success: false,
              message: 'Invalid ingredients JSON string',
            });
        }
      }

      if (ingredients.length > 0) {
        product.ingredient = await processIngredients(ingredients, companyId);
      }
    }

    // === PARSE TAGS ===
    if (tags !== undefined) {
      try {
        const parsed = typeof tags === 'string' ? JSON.parse(tags) : tags;
        product.tags = Array.isArray(parsed) ? parsed.map(sanitize) : [];
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid tags format' });
      }
    }

    // Validate category
    if (
      features.hasCategories &&
      category !== undefined &&
      category !== (product.category || '').toString()
    ) {
      const categoryDoc = await Category.findOne({
        _id: category,
        companyId,
        deleted: false,
      });
      if (!categoryDoc)
        return res
          .status(400)
          .json({ success: false, message: 'Invalid category' });
      if (
        subCategoryName &&
        !categoryDoc.subCategory.includes(subCategoryName)
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid subCategoryName' });
      }
      product.category = category;
      product.subCategoryName = subCategoryName || null;
    } else if (subCategoryName !== undefined) {
      product.subCategoryName = subCategoryName || null;
    }

    // Validate vendor
    if (
      features.hasVendors &&
      vendor !== undefined &&
      vendor !== product.vendor
    ) {
      const ven = await Vendor.findOne({
        _id: vendor,
        companyId,
        deleted: false,
      });
      if (!ven)
        return res
          .status(400)
          .json({ success: false, message: 'Invalid vendor' });
      product.vendor = vendor;
    }

    // Apply scalar updates
    if (productName !== undefined) product.productName = sanitize(productName);
    if (description !== undefined)
      product.description = sanitize(description || '');
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (stockQuantity !== undefined) product.quantity = Number(stockQuantity);

    product.history.push({
      action: 'UPDATED',
      performedBy: userId,
      details: `Updated by ${userId}`,
    });
    await product.save();

    const populated = await Product.findById(product._id)
      .populate('ingredient.ingredientId', 'ingredientName')
      .lean();

    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: 'Invalid ID' });

    const product = await Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });

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
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: 'Invalid ID' });

    const product = await Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });

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
      return res
        .status(400)
        .json({ success: false, message: 'stockData must be non-empty array' });
    }

    const results = [];
    for (const { productId, quantity } of stockData) {
      if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid productId or quantity' });
      }

      const product = await Product.findOne({
        _id: productId,
        companyId,
        deleted: false,
      });
      if (!product)
        return res
          .status(404)
          .json({ success: false, message: `Product ${productId} not found` });

      if (!product.isActive)
        return res
          .status(400)
          .json({ success: false, message: 'Cannot update inactive product' });

      product.quantity = Math.max(0, (product.quantity || 0) + quantity);
      product.history.push({
        action: 'STOCK_UPDATED',
        performedBy: userId,
        details: `+${quantity}`,
      });
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
      return res
        .status(400)
        .json({ success: false, message: 'Query too short' });
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
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
