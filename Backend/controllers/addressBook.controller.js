// controllers/addressBookController.js
import IndexModel from "../models/indexModel.js";
import mongoose from "mongoose";

// Create new address with manual rollback
const createAddress = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      fullName,
      phoneNumber,
      alternatePhone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
      addressType,
    } = req.body;

    // Basic validation for required fields
    if (
      !fullName ||
      !phoneNumber ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // If user marks this address as default, remove default from others
    let previousDefaultAddresses = [];
    if (isDefault) {
      previousDefaultAddresses = await IndexModel.AddressBook.find({
        userId,
        isDefault: true,
        deleted: false,
      }).select('_id');
      await IndexModel.AddressBook.updateMany(
        { userId, deleted: false },
        { $set: { isDefault: false } }
      );
    }

    // Create new address
    const newAddress = new IndexModel.AddressBook({
      userId,
      fullName,
      phoneNumber,
      alternatePhone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
      addressType,
      history: [
        {
          action: "Created",
          performedBy: userId,
        },
      ],
    });

    await newAddress.save();

    // Save the new addressId into User collection
    try {
        // console.log("the userId: ", userId, newAddress._id)
      await IndexModel.User.findOneAndUpdate(
  { userId: userId, deleted: false }, // match by your custom userId field
  { $push: { addressBookId: newAddress._id } },
  { new: true }
);

    } catch (error) {
      // Manual rollback: Delete the newly created address
      await IndexModel.AddressBook.findByIdAndDelete(newAddress._id);
      // Restore previous default addresses if any
      if (isDefault && previousDefaultAddresses.length > 0) {
        await IndexModel.AddressBook.updateMany(
          { _id: { $in: previousDefaultAddresses.map(addr => addr._id) } },
          { $set: { isDefault: true } }
        );
      }
      throw new Error("Failed to update user with address ID: " + error.message);
    }

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    console.error(
      `Error creating address for user ${req.user.userId}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update address with manual rollback
const updateAddress = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Store original address for rollback
    const originalAddress = await IndexModel.AddressBook.findOne({
      _id: id,
      userId,
      deleted: false,
    });
    if (!originalAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If user marks this address as default, remove default from others
    let previousDefaultAddresses = [];
    if (updateData.isDefault) {
      previousDefaultAddresses = await IndexModel.AddressBook.find({
        userId,
        isDefault: true,
        deleted: false,
        _id: { $ne: id },
      }).select('_id');
      await IndexModel.AddressBook.updateMany(
        { userId, deleted: false },
        { $set: { isDefault: false } }
      );
    }

    // Update address
    const updatedAddress = await IndexModel.AddressBook.findOneAndUpdate(
      { _id: id, userId, deleted: false },
      {
        $set: updateData,
        $push: {
          history: {
            action: "Updated",
            performedBy: userId,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedAddress) {
      // Restore previous default addresses if any
      if (updateData.isDefault && previousDefaultAddresses.length > 0) {
        await IndexModel.AddressBook.updateMany(
          { _id: { $in: previousDefaultAddresses.map(addr => addr._id) } },
          { $set: { isDefault: true } }
        );
      }
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    // Manual rollback: Restore original address
    if (originalAddress) {
      await IndexModel.AddressBook.findByIdAndUpdate(
        id,
        { $set: originalAddress.toObject(), $pull: { history: { action: "Updated" } } },
        { new: true }
      );
      // Restore previous default addresses
      if (updateData.isDefault && previousDefaultAddresses.length > 0) {
        await IndexModel.AddressBook.updateMany(
          { _id: { $in: previousDefaultAddresses.map(addr => addr._id) } },
          { $set: { isDefault: true } }
        );
      }
    }
    console.error(
      `Error updating address ${req.params.id} for user ${req.user.userId}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get all addresses of logged-in user (no rollback needed)
const getAllAddresses = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const addresses = await IndexModel.AddressBook.find({
      userId,
      deleted: false,
    }).sort({ createdAt: -1 });
    if (!addresses || addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Addresses not found",
      });
    }

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error(
      `Error fetching addresses for user ${req.user.userId}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get single address by ID (no rollback needed)
const getAddressById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const address = await IndexModel.AddressBook.findOne({
      _id: id,
      userId,
      deleted: false,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({ success: true, address });
  } catch (error) {
    console.error(
      `Error fetching address ${req.params.id} for user ${req.user.userId}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Soft delete address (no rollback needed)
const deleteAddress = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // 1. Fetch the address first to check if it was default
    const originalAddress = await IndexModel.AddressBook.findOne({ _id: id, userId, deleted: false });

    if (!originalAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = originalAddress.isDefault === true;

    // 2. Soft delete the address
    const deletedAddress = await IndexModel.AddressBook.findOneAndUpdate(
      { _id: id, userId, deleted: false },
      {
        $set: { deleted: true, isDefault: false }, // remove default from deleted
        $push: {
          history: {
            action: "Deleted",
            performedBy: userId,
          },
        },
      },
      { new: true }
    );

    // 3. If the deleted address was default, set the latest created address as new default
    if (wasDefault) {
      // First, find the latest non-deleted address (excluding the just-deleted one)
      const latestAddress = await IndexModel.AddressBook.findOne(
        { userId, deleted: false, _id: { $ne: id } },
        { sort: { createdAt: -1 } }
      );

      if (latestAddress) {
        // Update it to be default
        await IndexModel.AddressBook.findOneAndUpdate(
          { _id: latestAddress._id },
          { $set: { isDefault: true } }
        );
      } else {
        console.warn(`No remaining addresses for user ${userId}`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error(
      `Error deleting address ${req.params.id} for user ${req.user.userId}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


export default {
  createAddress,
  getAllAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
};