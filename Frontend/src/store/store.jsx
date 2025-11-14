// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import { authSlice, authApi } from '@/features/authApi';
import toastReducer from '@/features/toastSlice';
import { toastMiddleware } from '@/middleware/toastMiddleware';
import { companyApi } from '@/features/CompanyApi';
import { userApi } from '@/features/userApi';
import { planApi } from '@/features/planApi';

import { vendorApi } from '@/features/vendorApi';
import { staffApi } from '@/features/staffApi';
import { addressApi } from '@/features/addressApi';
import { billsApi } from '@/features/billingApi';
import { settingsApi } from '@/features/settingsApi';
import { activityApi } from '@/features/activeLogApi';
import { StaffSalary } from '@/features/staffSalaryApi';
import { attendanceDeviceApi } from '@/features/attendanceDeviceApi';
import { attendanceApi } from '@/features/attendanceApi';
import { shipmentsApi } from '@/features/shipmentsApi';
import { couriersApi } from '@/features/couriersApi';
import { paymentGatewayApi } from '@/features/paymentGatewayApi';
import { categoryApi } from '@/features/categoryApi';
import { productApi } from '@/features/productApi';
import { ingredientApi } from '@/features/ingredientApi';
import { superAdminApi } from '@/features/superAdminApi';
import { landingApi } from '@/features/landingApi';
import { orderApi } from '@/features/orderApi';
import { tableApi } from '@/features/tableApi';
import { dataManagementApi } from '@/features/dataManagementApi';
import { companyExcelApi } from '@/features/companyExcelApi';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    toast: toastReducer,
    [authApi.reducerPath]: authApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [planApi.reducerPath]: planApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [tableApi.reducerPath]: tableApi.reducer,
    [vendorApi.reducerPath]: vendorApi.reducer,
    [staffApi.reducerPath]: staffApi.reducer,
    [addressApi.reducerPath]: addressApi.reducer,
    [billsApi.reducerPath]: billsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    [StaffSalary.reducerPath]: StaffSalary.reducer,
    [attendanceDeviceApi.reducerPath]: attendanceDeviceApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [shipmentsApi.reducerPath]: shipmentsApi.reducer,
    [couriersApi.reducerPath]: couriersApi.reducer,
    [paymentGatewayApi.reducerPath]: paymentGatewayApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
    [ingredientApi.reducerPath]: ingredientApi.reducer,
    [superAdminApi.reducerPath]: superAdminApi.reducer,
    [landingApi.reducerPath]: landingApi.reducer,
    [dataManagementApi.reducerPath]: dataManagementApi.reducer,
    [companyExcelApi.reducerPath]: companyExcelApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      toastMiddleware,
      companyApi.middleware,
      userApi.middleware,
      planApi.middleware,
      orderApi.middleware,
      vendorApi.middleware,
      staffApi.middleware,
      addressApi.middleware,
      billsApi.middleware,
      settingsApi.middleware,
      activityApi.middleware,
      StaffSalary.middleware,
      attendanceDeviceApi.middleware,
      attendanceApi.middleware,
      shipmentsApi.middleware,
      couriersApi.middleware,
      paymentGatewayApi.middleware,
      categoryApi.middleware,
      productApi.middleware,
      ingredientApi.middleware,
      superAdminApi.middleware,
      landingApi.middleware,
      tableApi.middleware,
      dataManagementApi.middleware,
      companyExcelApi.middleware,
    ),
});

export default store;
