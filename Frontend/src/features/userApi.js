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

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      // Remove Content-Type: application/json to allow FormData to set multipart/form-data
      // headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
    fetchFn: async (input, init) => {
      try {
        const isReq = input instanceof Request;
        const method = init?.method || (isReq ? input.method : "GET");
        const url = isReq ? input.url : String(input);
      } catch {}
      return fetch(input, init);
    },
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => "/user/get-all-users",
      transformResponse: (res) => {
        if (res?.success && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: "User", id: u._id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    getAllCustomerUsers: builder.query({
      query: () => "/user/get-all-customer-users",
      transformResponse: (res) => {
        if (res?.success && Array.isArray(res.users)) return res.users;
        if (Array.isArray(res)) return res;
        throw new Error(res?.message || "Failed to fetch customer users");
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: "User", id: u._id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    toggleUserStatus: builder.mutation({
      query: (userId) => ({
        url: `/user/active_inactive-user/${userId}`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, userId) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),
    initiateEmailChange: builder.mutation({
      query: (body) => ({
        url: "/user/email-change",
        method: "POST",
        body,
      }),
      transformResponse: (res) => ({
        success: res?.success,
        message: res?.message,
        expiresAt: res?.data?.expiresAt ?? null,
      }),
    }),
    verifyEmailChange: builder.mutation({
      query: (body) => ({
        url: "/user/verify-email",
        method: "POST",
        body,
      }),
      transformResponse: (res) => ({
        success: res?.success,
        message: res?.message,
        data: res?.data,
      }),
      invalidatesTags: (result) =>
        result?.data?.id
          ? [
              { type: "User", id: result.data.id },
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    initiatePasswordChange: builder.mutation({
      query: (body) => ({
        url: "/user/password-change",
        method: "POST",
        body,
      }),
      transformResponse: (res) => ({
        success: res?.success,
        message: res?.message,
        expiresAt: res?.data?.expiresAt ?? null,
      }),
    }),
    verifyPasswordChange: builder.mutation({
      query: (body) => ({
        url: "/user/password-verify",
        method: "POST",
        body,
      }),
      transformResponse: (res) => ({
        success: res?.success,
        message: res?.message,
        data: res?.data,
      }),
    }),
    updateSuperAdminInfo: builder.mutation({
      query: (formData) => ({
        url: "/superadmin/update-super-admin-info-by-super-admin",
        method: "PATCH",
        body: formData, // Pass raw FormData
      }),
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetAllCustomerUsersQuery,
  useToggleUserStatusMutation,
  useInitiateEmailChangeMutation,
  useVerifyEmailChangeMutation,
  useInitiatePasswordChangeMutation,
  useVerifyPasswordChangeMutation,
  useUpdateSuperAdminInfoMutation,
} = userApi;