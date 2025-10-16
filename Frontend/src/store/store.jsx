// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import { authSlice, authApi } from '@/features/authApi';
import toastReducer from '@/features/toastSlice';
import { toastMiddleware } from '@/middleware/toastMiddleware';
import { companyApi } from '@/features/CompanyApi';
import { userApi } from '@/features/userApi';
import { planApi } from '@/features/planApi';
import { ordersApi } from '@/features/ordersApi';
import { vendorApi } from '@/features/vendorApi';
import { inventoryApi } from '@/features/inventoryApi';
import { staffApi } from '@/features/staffApi';
import { addressApi } from '@/features/addressApi';
import { billsApi } from '@/features/billingApi';
import { settingsApi } from '@/features/settingsApi';
import { activityApi } from '@/features/activeLogApi';
import { StaffSalary } from '@/features/staffSalaryApi';
import { attendanceDeviceApi } from '@/features/attendanceDeviceApi';
import { attendanceApi } from '@/features/attendanceApi';
import { shipmentsApi } from '@/features/shipmentsApi';
import {couriersApi} from '@/features/couriersApi'
import { paymentGatewayApi } from '@/features/paymentGatewayApi';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    toast: toastReducer,
    [authApi.reducerPath]: authApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [planApi.reducerPath]: planApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [vendorApi.reducerPath]: vendorApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
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

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      toastMiddleware,
      companyApi.middleware,
      userApi.middleware,
      planApi.middleware,
      ordersApi.middleware,
      vendorApi.middleware,
      inventoryApi.middleware,
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
    ),
});

export default store;