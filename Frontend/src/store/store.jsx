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
      addressApi.middleware
    ),
});

export default store;
