// src/features/billingApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3455"
).replace(/\/$/, "");

export const billsApi = createApi({
  reducerPath: "billsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/billing`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token =
        getState()?.auth?.token ||
        (typeof window !== "undefined" &&
          sessionStorage.getItem("authToken")) ||
        null;

      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Bills"],
  endpoints: (builder) => ({
    // GET /api/billing/get-all-bills
    getBills: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/get-all-bills",
        params: { page, limit },
      }),
      transformResponse: (res) => ({
        data: Array.isArray(res) ? res : res?.data ?? [],
        pagination: res.pagination || { page: 1, totalPages: 1, total: 0 },
      }),
      providesTags: (result) =>
        Array.isArray(result?.data)
          ? [
              ...result.data
                .filter(Boolean)
                .map((b) => ({ type: "Bills", id: b._id || b.id })),
              { type: "Bills", id: "LIST" },
            ]
          : [{ type: "Bills", id: "LIST" }],
    }),

    // GET /api/billing/get-bill/:idOrNumber
    getBillById: builder.query({
      query: (id) => `/get-bill/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Bills", id }],
    }),

    // POST /api/billing/create-bill
    createBill: builder.mutation({
      query: (body) => ({
        url: "/create-bill",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Bills", id: "LIST" }],
    }),

    // PATCH /api/billing/update-bills-status/:id
    updateBillStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/update-bills-status/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Bills", id },
        { type: "Bills", id: "LIST" },
      ],
    }),

    // DELETE /api/billing/delete-bill/:id
    softDeleteBill: builder.mutation({
      query: (id) => ({
        url: `/delete-bill/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Bills", id },
        { type: "Bills", id: "LIST" },
      ],
    }),

  }),
});

export const {
  useGetBillsQuery,
  useGetBillByIdQuery,
  useCreateBillMutation,
  useUpdateBillStatusMutation,
  useSoftDeleteBillMutation,
} = billsApi;
