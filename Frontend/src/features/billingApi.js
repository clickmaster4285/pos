// src/features/billsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3455'
).replace(/\/$/, '');

export const billsApi = createApi({
  reducerPath: 'billsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/billing`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token =
        getState()?.auth?.token ||
        (typeof window !== 'undefined' &&
          sessionStorage.getItem('authToken')) ||
        null;

      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Bills'],
  endpoints: (builder) => ({
    // GET /api/bill/  (companyId comes from JWT; no arg required)
    getBills: builder.query({
      query: () => `/get-all-bills`,
      transformResponse: (res) => (Array.isArray(res) ? res : res?.data ?? []),
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result
                .filter(Boolean)
                .map((b) => ({ type: 'Bills', id: b._id || b.id })),
              { type: 'Bills', id: 'LIST' },
            ]
          : [{ type: 'Bills', id: 'LIST' }],
    }),

    // GET /api/bill/:idOrNumber
    getBillById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Bills', id }],
    }),

    // POST /api/bill
    createBill: builder.mutation({
      query: (body) => ({
        url: `/create-bill`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bills', id: 'LIST' }],
    }),

    // PATCH /api/bill/:id/status
    updateBillStatus: builder.mutation({
      query: ({ id, body }) => {
        console.log('Updating bill status for ID:', id, 'with body:', body);
        return {
          url: `/update-bills-status/${id}`, // must be plain string ObjectId
          method: 'PATCH',
          body, // your payload (status, refundItems, notes, etc.)
        };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Bills', id },
        { type: 'Bills', id: 'LIST' },
      ],
    }),

    // DELETE /api/bill/:id  (soft delete)
    softDeleteBill: builder.mutation({
      query: (id) => ({
        url: `/delete-bill/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Bills', id },
        { type: 'Bills', id: 'LIST' },
      ],
    }),

    // // PATCH /api/bill/:id/restore
    // restoreBill: builder.mutation({
    //   query: (id) => ({
    //     url: `/${id}/restore`,
    //     method: 'PATCH',
    //   }),
    //   invalidatesTags: (_res, _err, id) => [
    //     { type: 'Bills', id },
    //     { type: 'Bills', id: 'LIST' },
    //   ],
    // }),
  }),
});

export const {
  useGetBillsQuery,
  useGetBillByIdQuery,
  useCreateBillMutation,
  useUpdateBillStatusMutation,
  useSoftDeleteBillMutation,
  // useRestoreBillMutation,
} = billsApi;
