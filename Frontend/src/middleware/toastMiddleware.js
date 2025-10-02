import { isRejectedWithValue, isFulfilled } from "@reduxjs/toolkit";
import { addToast } from "@/features/toastSlice";

export const toastMiddleware = (store) => (next) => (action) => {
  if (isFulfilled(action)) {
    const { type, meta, payload } = action;
    // console.log("Fulfilled action:", type, payload, meta);

    const endpoint = meta?.arg?.endpointName;

    const toastTypes = {
      // authApi
      login: {
        type: "success",
        name: payload?.data?.user?.name || "",
        details: `Welcome back, ${payload?.data?.user?.name || "User"}!`,
        status: payload?.status || 200,
      },
      logout: {
        type: "success",
        details: "Logged out successfully",
        status: payload?.status || 200,
      },
      registerUser: {
        type: "success",
        name: payload?.data?.user?.name || "",
        details: `Account created for ${payload?.data?.user?.name || "User"}`,
        status: payload?.status || 201,
      },
      refreshToken: {
        type: "success",
        details: "Session refreshed successfully",
        status: payload?.status || 200,
      },
      // getMe: {
      //   type: "success",
      //   details: "User data fetched successfully",
      //   status: payload?.status || 200,
      // },
      verifyEmail: {
        type: "success",
        details: "Email verified successfully",
        status: payload?.status || 200,
      },

      // addressApi
      // getAddresses: {
      //   type: "success",
      //   details: "Addresses fetched successfully",
      //   status: payload?.status || 200,
      // },
      // getAddressById: {
      //   type: "success",
      //   details: "Address details fetched successfully",
      //   status: payload?.status || 200,
      // },
      createAddress: {
        type: "success",
        details: "Address created successfully",
        status: payload?.status || 201,
      },
      updateAddress: {
        type: "success",
        details: "Address updated successfully",
        status: payload?.status || 200,
      },
      deleteAddress: {
        type: "success",
        details: "Address deleted successfully",
        status: payload?.status || 200,
      },

      // companyApi
      createCompany: {
        type: "success",
        details: "Company created successfully",
        status: payload?.status || 201,
      },
      // getAllCompanies: {
      //   type: "success",
      //   details: "Fetched all companies successfully",
      //   status: payload?.status || 200,
      // },
      verifyCompanyAdmin: {
        type: "success",
        details: "Company admin verified successfully",
        status: payload?.status || 200,
      },
      verifyEmailCode: {
        type: "success",
        details: "Email verified successfully",
        status: payload?.status || 200,
      },
      resendVerificationCode: {
        type: "success",
        details: "Verification code resent successfully",
        status: payload?.status || 200,
      },
      toggleCompanyStatus: {
        type: "success",
        details: "Company status updated successfully",
        status: payload?.status || 200,
      },

      // ordersApi
      // getOrders: {
      //   type: "success",
      //   details: "Orders fetched successfully",
      //   status: payload?.status || 200,
      // },
      // getOrderById: {
      //   type: "success",
      //   details: "Order details fetched successfully",
      //   status: payload?.status || 200,
      // },
      createOrder: {
        type: "success",
        details: "Order created successfully",
        status: payload?.status || 201,
      },
      updateOrderStatus: {
        type: "success",
        details: "Order status updated successfully",
        status: payload?.status || 200,
      },
      cancelOrderItems: {
        type: "success",
        details: "Order items cancelled successfully",
        status: payload?.status || 200,
      },
      requestReturn: {
        type: "success",
        details: "Return request submitted successfully",
        status: payload?.status || 200,
      },
      handleReturnRequest: {
        type: "success",
        details: "Return request processed successfully",
        status: payload?.status || 200,
      },

      // planApi
      // getAllPlans: {
      //   type: "success",
      //   details: "Plans fetched successfully",
      //   status: payload?.status || 200,
      // },
      createPlan: {
        type: "success",
        details: "Plan created successfully",
        status: payload?.status || 201,
      },
      updatePlan: {
        type: "success",
        details: "Plan updated successfully",
        status: payload?.status || 200,
      },
      deletePlan: {
        type: "success",
        details: "Plan deleted successfully",
        status: payload?.status || 200,
      },

      // inventoryApi
      // getInventory: {
      //   type: "success",
      //   details: "Inventory items fetched successfully",
      //   status: payload?.status || 200,
      // },
      // getInventoryById: {
      //   type: "success",
      //   details: "Inventory item details fetched successfully",
      //   status: payload?.status || 200,
      // },
      createInventoryItem: {
        type: "success",
        details: "Inventory item created successfully",
        status: payload?.status || 201,
      },
      updateInventoryInfo: {
        type: "success",
        details: "Inventory info updated successfully",
        status: payload?.status || 200,
      },
      addStock: {
        type: "success",
        details: "Stock added successfully",
        status: payload?.status || 200,
      },
      updateInventoryItem: {
        type: "success",
        details: "Inventory item updated successfully",
        status: payload?.status || 200,
      },
      deleteInventoryItem: {
        type: "success",
        details: "Inventory item deleted successfully",
        status: payload?.status || 200,
      },

      // userApi
      // getAllUsers: {
      //   type: "success",
      //   details: "Users fetched successfully",
      //   status: payload?.status || 200,
      // },
      // getAllCustomerUsers: {
      //   type: "success",
      //   details: "Customer users fetched successfully",
      //   status: payload?.status || 200,
      // },
      toggleUserStatus: {
        type: "success",
        details: "User status updated successfully",
        status: payload?.status || 200,
      },

      // staffApi
      // getAllStaff: {
      //   type: "success",
      //   details: "Staff members fetched successfully",
      //   status: payload?.status || 200,
      // },
      createStaff: {
        type: "success",
        details: "Staff member created successfully",
        status: payload?.status || 201,
      },
      updateStaff: {
        type: "success",
        details: "Staff member updated successfully",
        status: payload?.status || 200,
      },
      deleteStaff: {
        type: "success",
        details: "Staff member deleted successfully",
        status: payload?.status || 200,
      },

      // vendorApi
      createVendor: {
        type: "success",
        details: "Vendor created successfully",
        status: payload?.status || 201,
      },
      // getAllVendors: {
      //   type: "success",
      //   details: "Vendors fetched successfully",
      //   status: payload?.status || 200,
      // },
      // getVendorById: {
      //   type: "success",
      //   details: "Vendor details fetched successfully",
      //   status: payload?.status || 200,
      // },
      updateVendor: {
        type: "success",
        details: "Vendor updated successfully",
        status: payload?.status || 200,
      },
      deleteVendor: {
        type: "success",
        details: "Vendor deleted successfully",
        status: payload?.status || 200,
      },
      toggleVendorStatus: {
        type: "success",
        details: "Vendor status updated successfully",
        status: payload?.status || 200,
      },
    };

    const mapping = toastTypes[endpoint];

    if (mapping) {
      store.dispatch(
        addToast({
          ...mapping,
          details:
            mapping.details ||
            `Action completed successfully (Status: ${mapping.status})`,
        })
      );
    }
  }

  if (isRejectedWithValue(action)) {
    const errorMessage =
      action.payload?.message ||
      action.payload?.error ||
      "An error occurred. Please try again or contact support.";
    const status = action.payload?.status || action.error?.status || "Unknown";
    store.dispatch(
      addToast({
        type: "error",
        details: `${errorMessage} (Status: ${status})`,
      })
    );
  }

  return next(action);
};
