export const getPermissionsByIndustry = (industryName) => {
  if (!industryName) return {};

  const industry = industryName.trim().toLowerCase();

  // Always include compulsory permissions
  const finalPermissions = {
    ...permissionsCatalog.CompulsoryPermissions.reduce((obj, perm) => {
      obj[perm] = true;
      return obj;
    }, {}),
  };

  // Add industry-specific permissions if exists
  if (permissionsCatalog[industry]) {
    permissionsCatalog[industry].forEach((perm) => {
      finalPermissions[perm] = true;
    });
  }

  return finalPermissions;
};

// UserPermissionsCatelogs.js
const permissionsCatalog = {
  CompulsoryPermissions: [
    "createProduct",
    "updateProduct",
    "viewProduct",
    "deleteProduct",
    "approveRequests",
    "assignTasks",
    "managePlans",
    "manageTeams",
    "staffCreate",
    "staffDelete",
    "staffUpdate",
    "viewallstaff",
    "viewReports",
    "editBilling",
    "deleteBilling",
    "addBilling",
    "viewBilling",
    "createPayment",
    "viewAllStaffSalaries",
    "updateSalary",
    "deletePayment",
    "staffSummary",
    "viewActiveLog",
    "viewCompanySummary",
    "companyprofileupdate",
    "updateCompanySettings",
    "createShipment",
    "updateShipment",
    "viewShipment",
    "deleteShipment",
    "createCourier",
    "updateCourier",
    "viewCourier",
    "deleteCourier",
    "createOrder",
    "viewOrder",
    "updateOrderStatus",
  ],

  restaurant: [
    "manageTables",
    "createIngredient",
    "updateIngredient",
    "viewIngredient",
    "deleteIngredient",
  ],

  fashion: [
    "createCategory",
    "updateCategory",
    "viewCategory",
    "deleteCategory",
    "createVendors",
    "updateVendors",
    "deleteVendors",
    "viewVendors",
  ],

  pharmacy: [
    "createCategory",
    "updateCategory",
    "viewCategory",
    "deleteCategory",
    "createVendors",
    "updateVendors",
    "deleteVendors",
    "viewVendors",
  ],

  electronics: [
    "createCategory",
    "updateCategory",
    "viewCategory",
    "deleteCategory",
    "createVendors",
    "updateVendors",
    "deleteVendors",
    "viewVendors",
  ],

  generalshop: [
    "createCategory",
    "updateCategory",
    "viewCategory",
    "deleteCategory",
    "manageAppointments",
    "createVendors",
    "updateVendors",
    "deleteVendors",
    "viewVendors",
  ],
};

