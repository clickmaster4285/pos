import IndexModel from "../models/indexModel.js";

const createCategory = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { categoryName, subCategory, description, tags } = req.body;
    // console.log("the req.user: ", req.user)
    // Validate required fields
    if (!categoryName || !companyId || !req.user?.userId) {
      return res.status(400).json({
        success: false,
        message: "Category name, company ID, and creator ID are required",
      });
    }

    // Check for existing category with same name and company
    const existingCategory = await IndexModel.Category.findOne({
      categoryName,
      companyId,
      deleted: false,
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists for the company",
      });
    }

    // Create new category
    const category = new IndexModel.Category({
      categoryName,
      subCategory: subCategory || [],
      companyId,
      description,
      tags: tags || [],
      isActive: true,
      createdBy: req.user.userId,
      history: [
        {
          action: "CREATED",
          performedBy: req.user.userId,
          details: `Category created by ${req.user.userId}`,
        },
      ],
    });

    // Save category
    const savedCategory = await category.save();

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: savedCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error.message,
    });
  }
};

// Get getAllCategory
const getAllCategory = async (req, res) => {
  try {
    const categories = await IndexModel.Category.find({
      companyId: req.user.companyId,
      deleted: false,
    }).sort({ createdAt: -1 });

    if (!categories) {
      return res.status(404).json({
        success: false,
        error: "categories not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error while fetching company",
      details: error.message,
    });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;
    const { categoryName, subCategory, description, tags } = req.body;

    // Validate required fields
    if (!id || !companyId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Category ID, company ID, and user ID are required",
      });
    }

    // Find the category
    const category = await IndexModel.Category.findOne({
      _id: id,
      companyId,
      deleted: false,
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or does not belong to the company",
      });
    }
    if (category.isActive === false) {
      return res.status(404).json({
        success: false,
        message:
          "Currently this category is inactive, First status update, then retry",
      });
    }

    // Check for duplicate category name (excluding current category)
    if (categoryName && categoryName !== category.categoryName) {
      const existingCategory = await IndexModel.Category.findOne({
        categoryName,
        companyId,
        deleted: false,
        _id: { $ne: id },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
    }

    // Update fields
    category.categoryName = categoryName || category.categoryName;
    category.subCategory = subCategory || category.subCategory;
    category.description =
      description !== undefined ? description : category.description;
    category.tags = tags || category.tags;
    category.updatedAt = new Date();
    category.history.push({
      action: "UPDATED",
      performedBy: userId,
      details: `Category updated by ${userId}`,
    });

    // Save updated category
    const updatedCategory = await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
};

// Soft Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    // Validate required fields
    if (!id || !companyId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Category ID, company ID, and user ID are required",
      });
    }

    // Find the category
    const category = await IndexModel.Category.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or does not belong to the company",
      });
    }

    // Soft delete by setting deleted flag
    category.deleted = true;
    category.updatedAt = new Date();
    category.history.push({
      action: "DELETED",
      performedBy: userId,
      details: `Category soft-deleted by ${userId}`,
    });

    // Save updated category
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
};

// Toggle Category Status
const toggleCategoryStatus = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    // Validate required fields
    if (!id || !companyId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Category ID, company ID, and user ID are required",
      });
    }

    // Find the category
    const category = await IndexModel.Category.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or does not belong to the company",
      });
    }

    // Toggle status
    category.isActive = !category.isActive;
    category.updatedAt = new Date();
    category.history.push({
      action: category.isActive ? "ACTIVATED" : "DEACTIVATED",
      performedBy: userId,
      details: `Category ${
        category.isActive ? "activated" : "deactivated"
      } by ${userId}`,
    });

    // Save updated category
    const updatedCategory = await category.save();

    return res.status(200).json({
      success: true,
      message: `Category ${
        category.isActive ? "activated" : "deactivated"
      } successfully`,
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error toggling category status:", error);
    return res.status(500).json({
      success: false,
      message: "Error toggling category status",
      error: error.message,
    });
  }
};

export default {
  createCategory,
  getAllCategory,
  deleteCategory,
  updateCategory,
  toggleCategoryStatus,
};
