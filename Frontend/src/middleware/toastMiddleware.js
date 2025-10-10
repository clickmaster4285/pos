// src/middleware/toastMiddleware.js
import { isRejectedWithValue, isFulfilled } from "@reduxjs/toolkit";
import { addToast } from "@/features/toastSlice";

export const toastMiddleware = (store) => (next) => (action) => {
  // Define the allowed endpoints for toasts
  const allowedEndpoints = [
    'login',
    'registerUser',
    'verifyEmail',
    'logout',
    'refreshToken',
    'createAddress',
    'updateAddress',
    'deleteAddress',
    'createCompany',
    'toggleCompanyStatus',
    'createOrder',
    'updateOrderStatus',
    'cancelOrderItems',
    'requestReturn',
    'handleReturnRequest',
    'createInventoryItem',
    'updateInventoryInfo',
    'addStock',
    'updateInventoryItem',
    'deleteInventoryItem',
    'createPayment',
    'updateSalary',
    'deleteSalary',
    'createStaff',
    'updateStaff',
    'deleteStaff',
    'updateCompanySettings',
    'createPlan',
    'updatePlan',
    'deletePlan',
    'createVendor',
    'updateVendor',
    'deleteVendor',
    'toggleVendorStatus',
    'toggleUserStatus',
    'createDevice',
    'connectDevice',
    'createBill',
    'updateBillStatus',
    'softDeleteBill',
    'verifyCompanyAdmin',
    'emailSend',
  ];

  if (isFulfilled(action)) {
    const { meta, payload } = action;
    const endpoint = meta?.arg?.endpointName;

    // Only show toast for allowed endpoints
    if (allowedEndpoints.includes(endpoint)) {
      const toastTypes = {
        // authApi
        login: {
          type: "success",
          title: `Welcome, ${payload?.data?.user?.name || "User"}!`,
          description: "You are now logged in.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        registerUser: {
          type: "success",
          title: "Account Created",
          description: `Welcome, ${payload?.data?.user?.name || "User"}!`,
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        verifyEmail: {
          type: "success",
          title: "Email Verified",
          description: "Your email has been verified successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        logout: {
          type: "success",
          title: "Logged Out",
          description: "You have been logged out successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        refreshToken: {
          type: "success",
          title: "Session Refreshed",
          description: "Your session has been extended.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // addressApi
        createAddress: {
          type: "success",
          title: "Address Created",
          description: "New shipping address added successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updateAddress: {
          type: "success",
          title: "Address Updated",
          description: "Address details updated successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        deleteAddress: {
          type: "success",
          title: "Address Deleted",
          description: "Address removed successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // companyApi
        createCompany: {
          type: "success",
          title: "Company Created",
          description: "Your company has been created.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        toggleCompanyStatus: {
          type: "success",
          title: "Company Status Updated",
          description: "Company status changed successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        verifyCompanyAdmin: {
          type: "success",
          title: "Verification Processed",
          description: `Company admin verification ${action.meta?.arg?.originalArgs?.action === 'approve' ? 'approved' : 'rejected'} successfully.`,
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // ordersApi
        createOrder: {
          type: "success",
          title: "Order Created",
          description: "Your order has been placed successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updateOrderStatus: {
          type: "success",
          title: "Order Status Updated",
          description: "Order status has been updated.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        cancelOrderItems: {
          type: "success",
          title: "Order Items Cancelled",
          description: "Selected items have been cancelled.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        requestReturn: {
          type: "success",
          title: "Return Requested",
          description: "Your return request has been submitted.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        handleReturnRequest: {
          type: "success",
          title: "Return Request Processed",
          description: "Return request has been processed.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // inventoryApi
        createInventoryItem: {
          type: "success",
          title: "Inventory Item Created",
          description: "New inventory item added.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updateInventoryInfo: {
          type: "success",
          title: "Inventory Updated",
          description: "Inventory details updated.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        addStock: {
          type: "success",
          title: "Stock Added",
          description: "Stock added successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updateInventoryItem: {
          type: "success",
          title: "Inventory Item Updated",
          description: "Inventory item updated successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        deleteInventoryItem: {
          type: "success",
          title: "Inventory Item Deleted",
          description: "Inventory item removed.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // staffSalaryApi
        createPayment: {
          type: "success",
          title: "Payment Created",
          description: "Payment has been processed.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updateSalary: {
          type: "success",
          title: "Salary Updated",
          description: "Salary details updated.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        deleteSalary: {
          type: "success",
          title: "Salary Deleted",
          description: "Salary record removed.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // staffApi
        createStaff: {
          type: "success",
          title: "Staff Added",
          description: "New staff member created.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updateStaff: {
          type: "success",
          title: "Staff Updated",
          description: "Staff details updated.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        deleteStaff: {
          type: "success",
          title: "Staff Removed",
          description: "Staff member deleted.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // settingsApi
        updateCompanySettings: {
          type: "success",
          title: "Settings Updated",
          description: "Company settings updated successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // planApi
        createPlan: {
          type: "success",
          title: "Plan Created",
          description: "New plan added.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updatePlan: {
          type: "success",
          title: "Plan Updated",
          description: "Plan details updated.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        deletePlan: {
          type: "success",
          title: "Plan Deleted",
          description: "Plan removed successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // vendorApi
        createVendor: {
          type: "success",
          title: "Vendor Added",
          description: "New vendor created.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updateVendor: {
          type: "success",
          title: "Vendor Updated",
          description: "Vendor details updated.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        deleteVendor: {
          type: "success",
          title: "Vendor Removed",
          description: "Vendor deleted.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        toggleVendorStatus: {
          type: "success",
          title: "Vendor Status Changed",
          description: "Vendor status updated.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // userApi
        toggleUserStatus: {
          type: "success",
          title: "User Status Updated",
          description: "User account status changed.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // attendanceDeviceApi
        createDevice: {
          type: "success",
          title: "Device Registered",
          description: "Attendance device added.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        connectDevice: {
          type: "success",
          title: "Device Connected",
          description: "Device is now connected.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // billingApi
        createBill: {
          type: "success",
          title: "Bill Created",
          description: "New bill generated.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        updateBillStatus: {
          type: "success",
          title: "Bill Status Updated",
          description: "Bill status changed.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        softDeleteBill: {
          type: "success",
          title: "Bill Deleted",
          description: "Bill has been removed.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
        // Placeholder for email send endpoint
        emailSend: {
          type: "success",
          title: "Email Sent",
          description: "Email sent successfully.",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: "check-circle",
          actions: [],
        },
      };

      const mapping = toastTypes[endpoint];

      if (mapping) {
        store.dispatch(addToast(mapping));
      } else {
        console.warn(`No toast configuration found for endpoint: ${endpoint}`);
      }
    }
  }

  if (isRejectedWithValue(action)) {
    const endpoint = action.meta?.arg?.endpointName;

    // Only show error toast for allowed endpoints
    if (allowedEndpoints.includes(endpoint)) {
      const errorMessage =
        action.payload?.data?.message ||
        action.payload?.data?.error ||
        action.payload?.message ||
        "An unexpected error occurred.";

      const status = action.payload?.status || "Unknown";

      store.dispatch(
        addToast({
          type: "error",
          title: "Error",
          description: `${errorMessage}`,
          status,
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          icon: "alert-circle",
          actions: [],
        })
      );
    }
  }

  return next(action);
};