import IndexModel from "../models/indexModel.js";
import { generateSKU } from "../utils/generateUniqueSKU.js";

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

    // Validate required fields
    if (
      !productName ||
      !categoryName ||
      !companyId ||
      !userId ||
      !vendor ||
      !sellingPrice
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product name, category name, company ID, creator ID, vendor, and selling price are required",
      });
    }

    // Validate vendor exists and is active
    const vendorRecord = await IndexModel.Vendor.findOne({
      _id: vendor,
      companyId,
      deleted: false,
      isActive: true,
    });

    if (!vendorRecord) {
      return res.status(400).json({
        success: false,
        message: "Vendor not found or is inactive",
      });
    }

    // Check for existing product with same name and company
    const existingProduct = await IndexModel.Product.findOne({
      productName,
      companyId,
      deleted: false,
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists for the company",
      });
    }

    // Verify category exists and is active
    const category = await IndexModel.Category.findOne({
      categoryName,
      companyId,
      deleted: false,
      isActive: true,
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Active category not found for the company",
      });
    }

    // Verify subCategory exists in category if provided
    if (subCategory) {
      if (typeof subCategory !== "string") {
        return res.status(400).json({
          success: false,
          message: "subCategory must be a single string",
        });
      }
      if (!category.subCategory.includes(subCategory)) {
        return res.status(400).json({
          success: false,
          message: `Invalid subcategory: ${subCategory}`,
        });
      }
    }

    // Validate attribute format
    if (attribute && !Array.isArray(attribute)) {
      return res.status(400).json({
        success: false,
        message: "attribute must be an array of {key, value} objects",
      });
    }

    // Validate customAttributes format
    if (customAttributes && !Array.isArray(customAttributes)) {
      return res.status(400).json({
        success: false,
        message: "customAttributes must be an array of {key, value} objects",
      });
    }

    // Handle SKU: use provided SKU or generate one
    let finalSKU = SKU;
    if (!finalSKU || finalSKU.trim() === "") {
      const [generatedSKU] = await generateSKU("PRODUCT", companyId, 1);
      finalSKU = generatedSKU;
    } else {
      // Validate provided SKU uniqueness
      const existingSKU = await IndexModel.Product.findOne({
        SKU: finalSKU,
        companyId,
        deleted: false,
      });
      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: "Provided SKU is already in use",
        });
      }
    }

    // Create new product
    const product = new IndexModel.Product({
      productName,
      categoryName,
      subCategory: subCategory || "",
      companyId,
      description,
      tags: tags || [],
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
          action: "CREATED",
          performedBy: userId,
          details: `Product created by ${userId}`,
        },
      ],
    });

    // Save product
    const savedProduct = await product.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { categoryName, subCategory } = req.query;

    const query = {
      companyId,
      deleted: false,
    };

    if (categoryName) {
      query.categoryName = categoryName;
    }
    if (subCategory) {
      query.subCategory = subCategory;
    }

    const products = await IndexModel.Product.find(query).sort({
      createdAt: -1,
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found",
      });
    }

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching products",
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

    // Validate required fields
    if (!id || !companyId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Product ID, company ID, and user ID are required",
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
        message: "Product not found or does not belong to the company",
      });
    }

    if (product.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Product is inactive. Activate it before updating.",
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
          message: "Vendor not found or is inactive",
        });
      }
    }

    // Check for duplicate product name (excluding current product)
    if (productName && productName !== product.productName) {
      const existingProduct = await IndexModel.Product.findOne({
        productName,
        companyId,
        deleted: false,
        _id: { $ne: id },
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product with this name already exists",
        });
      }
    }

    // Check for duplicate SKU (excluding current product) if provided
    if (SKU && SKU !== product.SKU) {
      const existingSKU = await IndexModel.Product.findOne({
        SKU,
        companyId,
        deleted: false,
        _id: { $ne: id },
      });

      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: "Provided SKU is already in use",
        });
      }
    }

    // Verify category exists and is active if categoryName is provided
    if (categoryName && categoryName !== product.categoryName) {
      const category = await IndexModel.Category.findOne({
        categoryName,
        companyId,
        deleted: false,
        isActive: true,
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Active category not found for the company",
        });
      }

      // Verify subCategory exists in category if provided
      if (subCategory) {
        if (typeof subCategory !== "string") {
          return res.status(400).json({
            success: false,
            message: "subCategory must be a single string",
          });
        }
        if (!category.subCategory.includes(subCategory)) {
          return res.status(400).json({
            success: false,
            message: `Invalid subcategory: ${subCategory}`,
          });
        }
      }
    }

    // Validate attribute format
    if (attribute && !Array.isArray(attribute)) {
      return res.status(400).json({
        success: false,
        message: "attribute must be an array of {key, value} objects",
      });
    }

    // Update fields
    product.productName = productName || product.productName;
    product.categoryName = categoryName || product.categoryName;
    product.subCategory =
      subCategory !== undefined ? subCategory : product.subCategory;
    product.description =
      description !== undefined ? description : product.description;
    product.tags = tags || product.tags;
    product.vendor = vendor || product.vendor;
    product.SKU = SKU || product.SKU;
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
      action: "UPDATED",
      performedBy: userId,
      details: `Product updated by ${userId}`,
    });

    // Save updated product
    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    // Validate required fields
    if (!id || !companyId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Product ID, company ID, and user ID are required",
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
        message: "Product not found or does not belong to the company",
      });
    }

    // Soft delete by setting deleted flag
    product.deleted = true;
    product.updatedAt = new Date();
    product.history.push({
      action: "DELETED",
      performedBy: userId,
      details: `Product soft-deleted by ${userId}`,
    });

    // Save updated product
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

const toggleProductStatus = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    // Validate required fields
    if (!id || !companyId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Product ID, company ID, and user ID are required",
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
        message: "Product not found or does not belong to the company",
      });
    }

    // Toggle status
    product.isActive = !product.isActive;
    product.updatedAt = new Date();
    product.history.push({
      action: product.isActive ? "ACTIVATED" : "DEACTIVATED",
      performedBy: userId,
      details: `Product ${product.isActive ? "activated" : "deactivated"} by ${userId}`,
    });

    // Save updated product
    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error toggling product status:", error);
    return res.status(500).json({
      success: false,
      message: "Error toggling product status",
      error: error.message,
    });
  }
};

const updateProductStock = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { stockData } = req.body; // Array of { productId, quantity }

    if (!Array.isArray(stockData) || stockData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Stock data must be a non-empty array of { productId, quantity } objects",
      });
    }

    // Validate each stock entry
    for (const item of stockData) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each stock entry must have a valid productId and positive integer quantity",
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
        action: "STOCK_UPDATED",
        performedBy: userId,
        details: `Added ${item.quantity} to stock by ${userId}`,
      });

      const updatedProduct = await product.save();
      updatedProducts.push(updatedProduct);
    }

    return res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      data: updatedProducts,
    });
  } catch (error) {
    console.error("Error updating product stock:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating product stock",
      error: error.message,
    });
  }
};

export default {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateProductStock,
};