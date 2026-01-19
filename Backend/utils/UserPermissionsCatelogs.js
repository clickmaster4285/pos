import mongoose from 'mongoose';

const permissionsCatalog = {
  compulsory: [
    'createBranch', 'editBranch', 'viewAllBranches', 'deleteBranches',
    'createProduct', 'updateProduct', 'viewProduct', 'deleteProduct',
    'approveRequests', 'assignTasks', 'managePlans', 'manageTeams',
    'staffCreate', 'staffDelete', 'staffUpdate', 'viewallstaff',
    'viewReports', 'editBilling', 'deleteBilling', 'addBilling',
    'viewBilling', 'createPayment', 'viewAllStaffSalaries', 'updateSalary',
    'deletePayment', 'staffSummary', 'viewActiveLog', 'viewCompanySummary',
    'companyprofileupdate', 'updateCompanySettings', 'createShipment',
    'updateShipment', 'viewShipment', 'deleteShipment', 'createCourier',
    'updateCourier', 'viewCourier', 'deleteCourier', 'createOrder',
    'viewOrder', 'updateOrderStatus', 'createVendors', 'updateVendors',
    'deleteVendors', 'viewVendors', 'createCategory', 'updateCategory',
    'viewCategory', 'deleteCategory', 'manageAppointments'
  ],

  restaurant: ['manageTables', 'createIngredient', 'updateIngredient', 'viewIngredient', 'deleteIngredient'],
  fashion: [],
  pharmacy: [],
  electronics: [],
  generalshop: []
};

export const getDefaultPermissions = async (role, companyId) => {
  const rolePermissions = {
    superAdmin: {},
    admin: await getIndustryPermissions(companyId),
    staff: {
      viewProduct: true,
      viewOrder: true,
      updateOrderStatus: true,
      viewShipment: true,
      viewVendors: true,
      viewCategory: true
    },
    user: {
      viewProduct: true,
      createOrder: true,
      viewOrder: true
    }
  };

  return rolePermissions[role] || {};
};

export const getIndustryPermissions = async (companyId) => {
  if (!companyId) return permissionsCatalog.compulsory.reduce((acc, perm) => ({ ...acc, [perm]: true }), {});

  const Company = mongoose.model('Company');
  const company = await Company.findOne({ companyId }).lean();
  const industry = company?.industry?.toLowerCase() || 'generalshop';

  const industrySpecific = permissionsCatalog[industry] || [];
  const allPermissions = [...permissionsCatalog.compulsory, ...industrySpecific];

  return allPermissions.reduce((acc, perm) => ({ ...acc, [perm]: true }), {});
};

export const getAllPermissions = () => {
  const all = new Set(permissionsCatalog.compulsory);
  Object.values(permissionsCatalog).forEach(category => {
    if (Array.isArray(category)) category.forEach(perm => all.add(perm));
  });
  return Array.from(all).sort();
};

export const validatePermission = (permissionName, user) => {
  return user?.hasPermission?.(permissionName) || false;
};