// src/features/ordersApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3455'
).replace(/\/$/, '');

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/order`,
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
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    // GET /api/order/get-all-order/  (companyId comes from JWT; no arg required)
    getOrders: builder.query({
      query: () => `/get-all-order/`,
      transformResponse: (res) => (Array.isArray(res) ? res : []),
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result
                .filter(Boolean)
                .map((o) => ({ type: 'Orders', id: o._id || o.id })),
              { type: 'Orders', id: 'LIST' },
            ]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // GET /api/order/:id
    getOrderById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Orders', id }],
    }),

    // POST /api/order/create-order
    createOrder: builder.mutation({
      query: (body) => ({
        url: `/create-order`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }],
    }),

    // PUT /api/order/update-order-status/:id
    updateOrderStatus: builder.mutation({
      query: (id) => ({
        url: `/update-order-status/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Orders', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    // PUT /api/order/cancel-order/:id/:itemIds
    cancelOrderItems: builder.mutation({
      query: ({ id, itemIds }) => ({
        url: `/cancel-order/${id}/${
          Array.isArray(itemIds) ? itemIds.join(',') : itemIds
        }`,
        method: 'PUT',
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Orders', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    // PUT /api/order/return-order/:id/:itemIds
    requestReturn: builder.mutation({
      query: ({ id, itemIds }) => ({
        url: `/return-order/${id}/${
          Array.isArray(itemIds) ? itemIds.join(',') : itemIds
        }`,
        method: 'PUT',
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Orders', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    // PUT /api/order/return-request-update/:id/:itemId   body: { action: 'accept' | 'reject' }
    handleReturnRequest: builder.mutation({
      query: ({ id, itemId, action }) => ({
        url: `/return-request-update/${id}/${itemId}`,
        method: 'PUT',
        body: { action },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Orders', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useRequestReturnMutation,
  useHandleReturnRequestMutation,
  useCancelOrderItemsMutation,
} = ordersApi;
