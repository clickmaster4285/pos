// src/features/superAdminApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const getToken = (getState) =>
  getState()?.auth?.token ||
  (typeof window !== "undefined" && sessionStorage.getItem("authToken")) ||
  (typeof document !== "undefined" &&
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("authToken="))
      ?.split("=")[1]) ||
  null;

export const superAdminApi = createApi({
  reducerPath: "superAdminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["SuperAdmin", "User", "Dashboard"],
  endpoints: (builder) => ({
    // Dashboard Data
    getSuperAdminDashboard: builder.query({
      query: () => "/superadmin/super-admin-dashboard",
      providesTags: ["Dashboard"],
    }),

    // Existing endpoints
    updateSuperAdminInfo: builder.mutation({
      query: (formData) => ({
        url: "/superadmin/update-super-admin-info-by-super-admin",
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    createCompany: builder.mutation({
      query: (payload) => ({
        url: "/superadmin/create-company-by-super-admin",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "SuperAdmin" }],
    }),
  }),
});

export const {
  useGetSuperAdminDashboardQuery,
  useUpdateSuperAdminInfoMutation,
  useCreateCompanyMutation,
} = superAdminApi;