// features/orderApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const getToken = (getState) =>
  getState()?.auth?.token ||
  (typeof window !== 'undefined' && sessionStorage.getItem('authToken')) ||
  (typeof document !== 'undefined' &&
    document.cookie
      .split('; ')
      .find((r) => r.startsWith('authToken='))
      ?.split('=')[1]) ||
  null;

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/orders`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Order'],
  endpoints: (builder) => ({
    /* CREATE: POST /api/orders/create-order */
    createOrder: builder.mutation({
      query: (body) => {
    
        return { url: '/create-order', method: 'POST', body };
      },
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    /* LIST: GET /api/orders?status=&paymentStatus=&q=&page=&limit= */
    getOrders: builder.query({
      query: (params) => ({
        url: '/get-all-order',
        params, // { status, paymentStatus, q, page, limit }
      }),
      transformResponse: (res) => res?.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((o) => ({ type: 'Order', id: o._id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),

    /* GET BY ID: GET /api/orders/:id */
    getOrderById: builder.query({
      query: (id) => `/get-order-by-id/${id}`,
      transformResponse: (res) => res?.data ?? null,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    /* CANCEL WHOLE ORDER: PATCH /api/orders/:id/cancel */
    cancelOrder: builder.mutation({
      query: ({ id, performedBy }) => ({
        url: `/cancel-order/${id}`,
        method: 'PATCH',
        body: { performedBy },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    /* REFUND ORDER: PATCH /api/orders/:id/refund */
    refundOrder: builder.mutation({
      query: ({ id, amount, note, performedBy }) => ({
        url: `/refund-order/${id}`,
        method: 'PATCH',
        body: { amount, note, performedBy },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    updateStatus: builder.mutation({
      query: ({ id, ...body }) => {
        return {
          url: `/update-order-status/${id}`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  //
  useUpdateOrderMutation,
  useCancelOrderMutation,
  useRefundOrderMutation,

  //
  useUpdateStatusMutation,
} = orderApi;
