// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@/features/authApi';
import toastReducer from '@/features/toastSlice';
import { toastMiddleware } from '@/middleware/toastMiddleware';
import { autoRefreshMiddleware } from './autoRefreshMiddleware';

// Import all APIs from the centralized file
import * as apis from './apis';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    toast: toastReducer,
    // Dynamically add all API reducers
    ...Object.fromEntries(
      Object.entries(apis).map(([key, api]) => [api.reducerPath, api.reducer])
    )
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(
        // Add all API middlewares
        ...Object.values(apis).map(api => api.middleware),
        toastMiddleware,
        autoRefreshMiddleware
      ),
});

export default store;