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

const hasVendorsFeature = (activePlansFeature) => {
  return activePlansFeature?.limitations?.features?.includes('Vendors') || false;
};

const hasCategoriesFeature = (activePlansFeature) => {
  return activePlansFeature?.limitations?.features?.includes('Category') || false;
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

    // --- Validate company ---
    const companyFeature = await IndexModel.Company.findOne({
      companyId,
      deleted: false,
      isActive: true,
    }).lean();
    if (!companyFeature) {
      return res.status(404).json({
        success: false,
        message: 'You are not Authorized: the company was not found',
      });
    }

    const activePlansFeature = companyFeature.plan.find((plan) => plan.isActive === true);

    // --- Validate required ---
    if (!sanitizedProductName || !companyId || !userId || !sellingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Product name, company ID, creator ID, and selling price are required',
      });
    }

    // --- Validate vendor ---
    let vendorRecord = null;
    if (hasVendorsFeature(activePlansFeature) && vendor) {
      vendorRecord = await IndexModel.Vendor.findOne({
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
    let category = null;
    if (hasCategoriesFeature(activePlansFeature) && sanitizedCategoryName) {
      category = await IndexModel.Category.findOne({
        categoryName: sanitizedCategoryName,
        companyId: req.user.companyId,
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
      categoryName: hasCategoriesFeature(activePlansFeature) ? sanitizedCategoryName || '' : '',
      subCategory: hasCategoriesFeature(activePlansFeature) ? sanitizedSubCategory || '' : '',
      companyId,
      description: sanitizedDescription,
      tags: sanitizedTags,
      vendor: hasVendorsFeature(activePlansFeature) ? vendor || '' : '',
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
        message: 'Failed to update company after creating product',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
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
    const products = await IndexModel.Product.find({ companyId, deleted: false })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching products',
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
        message: 'Product not found',
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
      message: 'Error fetching product',
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
      sellingPrice,
      costPrice,
      quantity,
      location,
      condition,
      attribute,
      customAttributes,
      SKU,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // --- Sanitize ---
    const sanitize = (v) => (typeof v === 'string' ? v.trim() : v);
    const sanitizedProductName = sanitize(productName);
    const sanitizedCategoryName = sanitize(categoryName);
    const sanitizedSubCategory = sanitize(subCategory);
    const sanitizedDescription = sanitize(description);
    const sanitizedTags = Array.isArray(tags) ? tags.map(sanitize) : [];
    const sanitizedSKU = sanitize(SKU);

    // --- Validate company ---
    const companyFeature = await IndexModel.Company.findOne({
      companyId,
      deleted: false,
      isActive: true,
    }).lean();
    if (!companyFeature) {
      return res.status(404).json({
        success: false,
        message: 'You are not Authorized: the company was not found',
      });
    }

    const activePlansFeature = companyFeature.plan.find((plan) => plan.isActive === true);

    // --- Validate required ---
    if (!sanitizedProductName || !sellingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Product name and selling price are required',
      });
    }

    // --- Find product ---
    const product = await IndexModel.Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // --- Validate vendor ---
    let vendorRecord = null;
    if (hasVendorsFeature(activePlansFeature) && vendor) {
      vendorRecord = await IndexModel.Vendor.findOne({
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
    }

    // --- Check duplicate product name ---
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

    // --- Validate category ---
    let category = null;
    if (hasCategoriesFeature(activePlansFeature) && sanitizedCategoryName) {
      category = await IndexModel.Category.findOne({
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
    }

    // --- Validate SKU ---
    if (sanitizedSKU && sanitizedSKU.trim() !== '') {
      const existingSKU = await IndexModel.Product.findOne({
        SKU: sanitizedSKU,
        companyId,
        deleted: false,
        _id: { $ne: id },
      });
      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: 'Provided SKU already in use',
        });
      }
    }

    // --- Update product ---
    product.productName = sanitizedProductName;
    product.categoryName = hasCategoriesFeature(activePlansFeature) ? sanitizedCategoryName || '' : '';
    product.subCategory = hasCategoriesFeature(activePlansFeature) ? sanitizedSubCategory || '' : '';
    product.description = sanitizedDescription;
    product.tags = sanitizedTags;
    product.vendor = hasVendorsFeature(activePlansFeature) ? vendor || '' : '';
    product.SKU = sanitizedSKU || product.SKU;
    product.sellingPrice = sellingPrice;
    product.costPrice = costPrice || 0;
    product.quantity = quantity || 0;
    product.location = location;
    product.condition = condition;
    product.attribute = attribute || [];
    product.customAttributes = customAttributes || [];
    product.updatedAt = new Date();
    product.history.push({
      action: 'UPDATED',
      performedBy: userId,
      details: `Product updated by ${userId}`,
    });

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
  try {
    const { companyId, userId } = req.user;
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
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.deleted = true;
    product.updatedAt = new Date();
    product.history.push({
      action: 'DELETED',
      performedBy: userId,
      details: `Product deleted by ${userId}`,
    });

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

    const product = await IndexModel.Product.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.isActive = !product.isActive;
    product.updatedAt = new Date();
    product.history.push({
      action: product.isActive ? 'ACTIVATED' : 'DEACTIVATED',
      performedBy: userId,
      details: `Product ${product.isActive ? 'activated' : 'deactivated'} by ${userId}`,
    });

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

    // --- Validate company ---
    const companyFeature = await IndexModel.Company.findOne({
      companyId,
      deleted: false,
      isActive: true,
    }).lean();
    if (!companyFeature) {
      return res.status(404).json({
        success: false,
        message: 'You are not Authorized: the company was not found',
      });
    }

    const activePlansFeature = companyFeature.plan.find((plan) => plan.isActive === true);

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
        ...(hasCategoriesFeature(activePlansFeature)
          ? [
              { categoryName: { $regex: sanitizedQuery, $options: 'i' } },
              { subCategory: { $regex: sanitizedQuery, $options: 'i' } },
            ]
          : []),
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