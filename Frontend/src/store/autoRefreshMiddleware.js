// src/middleware/autoRefreshMiddleware.js

/**
 * Smart Auto-Refresh Middleware
 * - Only refreshes getAll / LIST queries when relevant data changes
 * - No unnecessary refetching (unlike refreshing everything)
 * - Automatically detects which API triggered the mutation
 * - Super easy to extend — just add one line per new API
 */

const refreshMap = {
  // When these APIs mutate → refresh these getAll queries
  orderApi: ['orderApi', 'productApi', 'ingredientApi', 'tableApi', 'billsApi'],
  productApi: ['productApi'],
  ingredientApi: ['ingredientApi', 'orderApi'],
  tableApi: ['tableApi', 'orderApi'],
  billsApi: ['billsApi', 'orderApi','productApi', 'tableApi','orderApi','ingredientApi'],

  staffApi: ['staffApi', 'StaffSalary'],
  StaffSalary: ['StaffSalary', 'staffApi'],

  attendanceApi: ['attendanceApi'],
  attendanceDeviceApi: ['attendanceDeviceApi', 'attendanceApi'],

  vendorApi: ['vendorApi'],
  addressApi: ['addressApi'],

  shipmentsApi: ['shipmentsApi', 'couriersApi'],
  couriersApi: ['couriersApi'],

  categoryApi: ['categoryApi', 'productApi'],

  userApi: ['userApi'],
  planApi: ['planApi'],

  settingsApi: ['settingsApi'],
  activityApi: ['activityApi'],

  dataManagementApi: ['productApi', 'orderApi', 'staffApi', 'vendorApi', 'billsApi'],
  companyExcelApi: ['productApi', 'orderApi', 'staffApi'],
};

// Tag type used in providesTags({ type: 'XXX', id: 'LIST' })
const tagMap = {
  orderApi: 'Order',
  productApi: 'Product',
  ingredientApi: 'Ingredient',
  tableApi: 'Table',
  billsApi: 'Bills',
  staffApi: 'Staff',
  StaffSalary: 'Salary',
  attendanceApi: 'Attendance',
  attendanceDeviceApi: 'AttendanceDevice',
  vendorApi: 'Vendor',
  addressApi: 'Addresses',
  shipmentsApi: 'Shipments',
  couriersApi: 'Couriers',
  categoryApi: 'Category',
  userApi: 'User',
  planApi: 'Plans',
  settingsApi: 'Settings',
  activityApi: 'Activity',
  dataManagementApi: 'BackupInfo',
  companyExcelApi: 'CompanyExcel',
};

// Import all APIs for direct access
import {
  orderApi, productApi, ingredientApi, tableApi, billsApi,
  staffApi, StaffSalary, attendanceApi, attendanceDeviceApi,
  vendorApi, addressApi, shipmentsApi, couriersApi, categoryApi,
  userApi, planApi, settingsApi, activityApi, dataManagementApi,
  companyExcelApi
} from './apis';

// API instance map for direct access
const apiInstances = {
  orderApi,
  productApi,
  ingredientApi,
  tableApi,
  billsApi,
  staffApi,
  StaffSalary,
  attendanceApi,
  attendanceDeviceApi,
  vendorApi,
  addressApi,
  shipmentsApi,
  couriersApi,
  categoryApi,
  userApi,
  planApi,
  settingsApi,
  activityApi,
  dataManagementApi,
  companyExcelApi
};

export const autoRefreshMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Only react to successful RTK Query mutations
  if (
    action.type?.endsWith('/fulfilled') &&
    action.type.includes('executeMutation')
  ) {
    // Extract API name: e.g., "orderApi/executeMutation/fulfilled" → "orderApi"
    const apiName = action.type.split('/')[0];

    const apisToRefresh = refreshMap[apiName];

    if (apisToRefresh && apisToRefresh.length > 0) {

      apisToRefresh.forEach((targetApi) => {
        const tagType = tagMap[targetApi];
        if (!tagType) return;

        // Use the imported API instance directly
        const api = apiInstances[targetApi];
        
        if (api?.util?.invalidateTags) {
          store.dispatch(api.util.invalidateTags([{ type: tagType, id: 'LIST' }]));
        }
      });
    }
  }

  return result;
};