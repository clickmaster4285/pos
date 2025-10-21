// src/controllers/product.controller.js
import IndexModel from '../models/indexModel.js';
import { generateSKU } from '../utils/generateUniqueSKU.js';
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

const createProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const {
      productName,
      categoryName,
      subCategory,
      description,
      tags,
      vendor,
      sellingPrice,
      costPrice,
      quantity,
      location,
      condition,
      attribute,
      customAttributes,
      SKU,
    } = req.body;

    // --- Sanitize ---
    const sanitize = (v) => (typeof v === 'string' ? v.trim() : v);
    const sanitizedProductName = sanitize(productName);
    const sanitizedCategoryName = sanitize(categoryName);
    const sanitizedSubCategory = sanitize(subCategory);
    const sanitizedDescription = sanitize(description);
    const sanitizedTags = Array.isArray(tags) ? tags.map(sanitize) : [];
    const sanitizedSKU = sanitize(SKU);

    // --- Validate required ---
    if (
      !sanitizedProductName ||
      !sanitizedCategoryName ||
      !companyId ||
      !userId ||
      !vendor ||
      !sellingPrice
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Product name, category name, company ID, creator ID, vendor, and selling price are required',
      });
    }

    // --- Validate vendor ---
    const vendorRecord = await IndexModel.Vendor.findOne({
      _id: vendor,
      companyId,
      deleted: false,
      isActive: true,
    });
    if (!vendorRecord) {
      return res.status(400).json({
        success: false,
        message: 'Vendor not found or inactive',
      });
    }

    // --- Check duplicates ---
    const existingProduct = await IndexModel.Product.findOne({
      productName: sanitizedProductName,
      companyId,
      deleted: false,
    });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists',
      });
    }

    // --- Validate category ---
    const category = await IndexModel.Category.findOne({
      categoryName: sanitizedCategoryName,
      companyId,
      deleted: false,
      isActive: true,
    });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Active category not found',
      });
    }

    if (sanitizedSubCategory) {
      if (!category.subCategory.includes(sanitizedSubCategory)) {
        return res.status(400).json({
          success: false,
          message: `Invalid subcategory: ${sanitizedSubCategory}`,
        });
      }
    }

    // --- Handle SKU ---
    let finalSKU = sanitizedSKU;
    if (!finalSKU || finalSKU.trim() === '') {
      const [generatedSKU] = await generateSKU('PRODUCT', companyId, 1);
      finalSKU = generatedSKU;
    } else {
      const existingSKU = await IndexModel.Product.findOne({
        SKU: finalSKU,
        companyId,
        deleted: false,
      });
      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: 'Provided SKU already in use',
        });
      }
    }

    // --- Create and save product ---
    const product = new IndexModel.Product({
      productName: sanitizedProductName,
      categoryName: sanitizedCategoryName,
      subCategory: sanitizedSubCategory || '',
      companyId,
      description: sanitizedDescription,
      tags: sanitizedTags,
      vendor,
      SKU: finalSKU,
      sellingPrice,
      costPrice: costPrice || 0,
      quantity: quantity || 0,
      location,
      condition,
      attribute: attribute || [],
      customAttributes: customAttributes || [],
      isActive: true,
      createdBy: userId,
      history: [
        {
          action: 'CREATED',
          performedBy: userId,
          details: `Product created by ${userId}`,
        },
      ],
    });

    const savedProduct = await product.save();

    // --- Try updating company ---
    const company = await IndexModel.Company.findOneAndUpdate(
      { companyId },
      {
        $inc: { 'gain.product': 1 },
        $push: {
          history: {
            action: `Product created ${savedProduct._id}`,
            performedBy: userId,
            createdAt: new Date(),
          },
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    // --- If company update fails, rollback product ---
    if (!company) {
      await IndexModel.Product.deleteOne({ _id: savedProduct._id });
      return res.status(500).json({
        success: false,
        message: 'Company update failed — product rolled back',
      });
    }

    // --- Success ---
    return res.status(201).json({
      success: true,
      message: 'Product created successfully and company updated',
      data: savedProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);

    // Rollback any product created if error happens mid-way
    if (error._message === 'Company validation failed' && savedProduct?._id) {
      await IndexModel.Product.deleteOne({ _id: savedProduct._id });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message,
    });
  }
};



const getAllProducts = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { categoryName, subCategory, page = 1, limit = 10 } = req.query;

    const query = {
      companyId,
      deleted: false,
      isActive: true, // Only return active products
    };

    if (categoryName) {
      query.categoryName = sanitizeInput(categoryName);
    }
    if (subCategory) {
      query.subCategory = sanitizeInput(subCategory);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      IndexModel.Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      IndexModel.Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found',
      });
    }

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        totalPages,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await IndexModel.Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to the company',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching product',
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    const {
      productName,
      categoryName,
      subCategory,
      description,
      tags,
      vendor,
      SKU,
      sellingPrice,
      costPrice,
      quantity,
      location,
      condition,
      attribute,
      customAttributes,
    } = req.body;

    // Sanitize inputs
    const sanitizedProductName = sanitizeInput(productName);
    const sanitizedCategoryName = sanitizeInput(categoryName);
    const sanitizedSubCategory = sanitizeInput(subCategory);
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedTags = Array.isArray(tags) ? tags.map(sanitizeInput) : [];
    const sanitizedSKU = sanitizeInput(SKU);

    // Validate required fields
    if (!id || !companyId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, company ID, and user ID are required',
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Find the product
    const product = await IndexModel.Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to the company',
      });
    }

    if (product.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Product is inactive. Activate it before updating.',
      });
    }

    // Validate vendor exists and is active
    if (vendor && vendor !== product.vendor) {
      const vendorRecord = await IndexModel.Vendor.findOne({
        _id: vendor,
        companyId,
        deleted: false,
        isActive: true,
      });

      if (!vendorRecord) {
        return res.status(400).json({
          success: false,
          message: 'Vendor not found or is inactive',
        });
      }
    }

    // Check for duplicate product name (excluding current product)
    if (sanitizedProductName && sanitizedProductName !== product.productName) {
      const existingProduct = await IndexModel.Product.findOne({
        productName: sanitizedProductName,
        companyId,
        deleted: false,
        _id: { $ne: id },
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this name already exists',
        });
      }
    }

    // Check for duplicate SKU (excluding current product) if provided
    if (sanitizedSKU && sanitizedSKU !== product.SKU) {
      const existingSKU = await IndexModel.Product.findOne({
        SKU: sanitizedSKU,
        companyId,
        deleted: false,
        _id: { $ne: id },
      });

      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: 'Provided SKU is already in use',
        });
      }
    }

    // Verify category exists and is active if categoryName is provided
    if (sanitizedCategoryName && sanitizedCategoryName !== product.categoryName) {
      const category = await IndexModel.Category.findOne({
        categoryName: sanitizedCategoryName,
        companyId,
        deleted: false,
        isActive: true,
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Active category not found for the company',
        });
      }

      // Verify subCategory exists in category if provided
      if (sanitizedSubCategory && !category.subCategory.includes(sanitizedSubCategory)) {
        return res.status(400).json({
          success: false,
          message: `Invalid subcategory: ${sanitizedSubCategory}`,
        });
      }
    }

    // Validate attribute format
    if (attribute && !Array.isArray(attribute)) {
      return res.status(400).json({
        success: false,
        message: 'attribute must be an array of {key, value} objects',
      });
    }

    // Update fields
    product.productName = sanitizedProductName || product.productName;
    product.categoryName = sanitizedCategoryName || product.categoryName;
    product.subCategory =
      sanitizedSubCategory !== undefined ? sanitizedSubCategory : product.subCategory;
    product.description =
      sanitizedDescription !== undefined ? sanitizedDescription : product.description;
    product.tags = sanitizedTags || product.tags;
    product.vendor = vendor || product.vendor;
    product.SKU = sanitizedSKU || product.SKU;
    product.sellingPrice =
      sellingPrice !== undefined ? sellingPrice : product.sellingPrice;
    product.costPrice = costPrice !== undefined ? costPrice : product.costPrice;
    product.quantity = quantity !== undefined ? quantity : product.quantity;
    product.location = location !== undefined ? location : product.location;
    product.condition = condition || product.condition;
    product.attribute = attribute || product.attribute;
    product.customAttributes = customAttributes || product.customAttributes;
    product.updatedAt = new Date();
    product.history.push({
      action: 'UPDATED',
      performedBy: userId,
      details: `Product updated by ${userId}`,
    });

    // Save updated product
    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  console.log("the i am here in deleteing the product")
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Find the product
    const product = await IndexModel.Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to the company',
      });
    }

    // Soft delete by setting deleted flag
    product.deleted = true;
    product.updatedAt = new Date();
    product.history.push({
      action: 'DELETED',
      performedBy: userId,
      details: `Product soft-deleted by ${userId}`,
    });

    // Save updated product
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message,
    });
  }
};

const toggleProductStatus = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Find the product
    const product = await IndexModel.Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to the company',
      });
    }

    // Toggle status
    product.isActive = !product.isActive;
    product.updatedAt = new Date();
    product.history.push({
      action: product.isActive ? 'ACTIVATED' : 'DEACTIVATED',
      performedBy: userId,
      details: `Product ${product.isActive ? 'activated' : 'deactivated'} by ${userId}`,
    });

    // Save updated product
    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Error toggling product status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error toggling product status',
      error: error.message,
    });
  }
};

const updateProductStock = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { stockData } = req.body;

    if (!Array.isArray(stockData) || stockData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock data must be a non-empty array of { productId, quantity } objects',
      });
    }

    // Validate each stock entry
    for (const item of stockData) {
      if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: 'Each stock entry must have a valid productId and integer quantity',
        });
      }

      // Find the product
      const product = await IndexModel.Product.findOne({
        _id: item.productId,
        companyId,
        deleted: false,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found or does not belong to the company`,
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.productId} is inactive. Activate it before updating stock.`,
        });
      }

      if ((product.quantity || 0) + item.quantity < 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce stock below 0 for product ${item.productId}`,
        });
      }
    }

    // Update stock for each product
    const updatedProducts = [];
    for (const item of stockData) {
      const product = await IndexModel.Product.findOne({
        _id: item.productId,
        companyId,
        deleted: false,
      });

      product.quantity = (product.quantity || 0) + item.quantity;
      product.updatedAt = new Date();
      product.history.push({
        action: 'STOCK_UPDATED',
        performedBy: userId,
        details: `Added ${item.quantity} to stock by ${userId}`,
      });

      const updatedProduct = await product.save();
      updatedProducts.push(updatedProduct);
    }

    return res.status(200).json({
      success: true,
      message: 'Product stock updated successfully',
      data: updatedProducts,
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating product stock',
      error: error.message,
    });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be a string with at least 2 characters',
      });
    }

    const sanitizedQuery = sanitizeInput(query);
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = {
      companyId,
      deleted: false,
      isActive: true,
      $or: [
        { productName: { $regex: sanitizedQuery, $options: 'i' } },
        { SKU: { $regex: sanitizedQuery, $options: 'i' } },
        { categoryName: { $regex: sanitizedQuery, $options: 'i' } },
        { subCategory: { $regex: sanitizedQuery, $options: 'i' } },
        { tags: { $regex: sanitizedQuery, $options: 'i' } },
      ],
    };

    const [products, total] = await Promise.all([
      IndexModel.Product.find(searchQuery)
        .sort({ productName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      IndexModel.Product.countDocuments(searchQuery),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found matching the query',
      });
    }

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        totalPages,
        total,
      },
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message,
    });
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