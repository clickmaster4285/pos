// import Vendor from "../models/vendor.model.js";
import IndexModel from "../models/indexModel.js";
// import { generateSKU } from '../utils/generateUniqueSKU.js';

// Create a new vendor
const createVendor = async (req, res) => {
  try {
    const user = req.user;
    const { name, contactName, email, phone, address, paymentType } = req.body;
    const createdBy = user.userId;
    const companyId = user.companyId;
    const vendor = new IndexModel.Vendor({
      name,
      contactName,
      email,
      phone,
      address,
      companyId,
      paymentType,
      createdBy,
      isActive: true,
      history: [{ action: "created", performedBy: createdBy }],
    });

    const company = await IndexModel.Company.findOneAndUpdate(
      { companyId: user.companyId },
      {
        $inc: { "gain.vendor": 1 },
        $push: {
          history: {
            action: `Vendor created${vendor._id}`,
            performedBy: user.userId,
          },
        },
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!company) {
      // Rollback: remove employee if company not found
      await IndexModel.Vendor.deleteOne({ _id: vendor._id });
      return res.status(404).json({
        success: false,
        message: "company not found. Vendor creation rolled back.",
      });
    }

    await vendor.save();
    res.status(201).json({ message: "Vendor created successfully", vendor });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating vendor", error: error.message });
  }
};

// Get all vendors for the user's company
const getAllVendors = async (req, res) => {
  try {
    const { companyId } = req.user;
    const vendors = await IndexModel.Vendor.find({
      companyId,
      deleted: false,
    });
    res.status(200).json(vendors);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching vendors", error: error.message });
  }
};

// Get a single vendor by ID
const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    // Fetch vendor with lean for performance
    const vendor = await IndexModel.Vendor.findOne({
      _id: id,
      companyId,
      deleted: false,
    }).lean();

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Fetch vendor history
    const vendorHistory = await IndexModel.History.find({
      "previousData._id": vendor._id,
    }).lean();

    // Structure response with history under vendor
    const dataVendor = {
      ...vendor,
      beforeUpdateHistory: vendorHistory,
    };

    res.status(200).json(dataVendor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vendor", error: error.message });
  }
};

// Update a vendor
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId } = req.user;
    const { name, contactName, email, phone, address, paymentType } = req.body;

    // Collect allowed updates
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (contactName !== undefined) updates.contactName = contactName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (paymentType !== undefined) updates.paymentType = paymentType;

    // Find vendor
    const vendor = await IndexModel.Vendor.findOne({
      _id: id,
      companyId,
      deleted: false,
      isActive: true,
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Old data
    const oldVendor = vendor.toObject();

    // Apply updates temporarily for newData snapshot
    const newVendorData = { ...oldVendor, ...updates };

    // Save history entry
    const historyEntry = new IndexModel.History({
      companyId,
      refId: vendor._id,
      model: 'Vendor',
      action: 'updated',
      performedBy: userId,
      previousData: oldVendor,
      newData: newVendorData,
      createdAt: new Date(),
    });

    await historyEntry.save();

    // Update vendor + push simple log
    Object.assign(vendor, updates);
    vendor.history.push({
      action: 'updated',
      performedBy: userId,
      createdAt: new Date(),
    });

    await vendor.save();

    return res.status(200).json({
      message: 'Vendor updated successfully',
      vendor,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Error updating vendor',
      error: error.message,
    });
  }
};

// Soft delete a vendor
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId } = req.user;

    const vendor = await IndexModel.Vendor.findOne({
      _id: id,
      companyId,
      deleted: false,
    });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.deleted = true;
    vendor.isActive = false;
    vendor.history.push({ action: "deleted", performedBy: userId });
    await vendor.save();

    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting vendor", error: error.message });
  }
};

const active_inactiveVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId } = req.user;

    // Find vendor with conditions
    const vendor = await IndexModel.Vendor.findOne({
      _id: id,
      companyId,
      deleted: false,
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Toggle isActive status
    const newStatus = !vendor.isActive;

    // Apply isActive update and add to history
    vendor.isActive = newStatus;
    vendor.history.push({
      action: `set isActive to ${newStatus}`,
      performedBy: userId,
      createdAt: new Date(),
    });

    // Save updated vendor only if history save was successful
    await vendor.save();

    return res.status(200).json({
      message: `Vendor ${newStatus ? 'activated' : 'deactivated'} successfully`,
      vendor,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Error updating vendor status",
      error: error.message,
    });
  }
};

export default {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  active_inactiveVendor
};
