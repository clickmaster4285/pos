// src/features/tableApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getToken = (getState) =>
  getState()?.auth?.token ||
  (typeof window !== 'undefined' && sessionStorage.getItem('authToken')) ||
  (typeof document !== 'undefined' &&
    document.cookie
      .split('; ')
      .find((r) => r.startsWith('authToken='))
      ?.split('=')[1]) ||
  null;

export const tableApi = createApi({
  reducerPath: 'tableApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/table`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Table'],
  endpoints: (builder) => ({
    // POST /api/table/create-table
    createTable: builder.mutation({
      query: (body) => ({ url: '/create-table', method: 'POST', body }),
      invalidatesTags: [{ type: 'Table', id: 'LIST' }],
    }),

    // GET /api/table/list-table?state=&name=
    listTables: builder.query({
      query: (params) => {
        const search = new URLSearchParams(params || {}).toString();
        return `/list-table${search ? `?${search}` : ''}`;
      },
      transformResponse: (res) => res?.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: 'Table', id: t._id })),
              { type: 'Table', id: 'LIST' },
            ]
          : [{ type: 'Table', id: 'LIST' }],
    }),

    // GET /api/table/get-table-by/:id
    getTableById: builder.query({
      query: (id) => `/get-table-by/${id}`,
      transformResponse: (res) => res?.data ?? null,
      providesTags: (result, error, id) => [{ type: 'Table', id }],
    }),

    // PATCH /api/table/update-table/:id
    updateTable: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/update-table/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // DELETE /api/table/remove-table/:id
    removeTable: builder.mutation({
      query: (id) => {
        console.log("id", id)
        return {
          url: `/remove-table/${id}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // POST /api/table/assign-waiter/:id  body: { waiterId }
    assignWaiter: builder.mutation({
      query: ({ id, waiterId }) => ({
        url: `/assign-waiter/${id}`,
        method: 'POST',
        body: { waiterId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // POST /api/table/clear-waiter/:id
    clearWaiter: builder.mutation({
      query: (id) => ({
        url: `/clear-waiter/${id}`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // POST /api/table/reserve/:id
    reserveTable: builder.mutation({
      // body: { startISO, endISO, name?, phone?, note? }
      query: ({ id, ...body }) => ({
        url: `/reserve/${id}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // POST /api/table/cancel-reservation/:id
    // in tableApi.js / tableApi.ts

    cancelReservation: builder.mutation({
    
      query: ({ id, resId, makeAvailable }) => ({
        url: `/cancel-reservation/${id}/${resId}`,
        method: 'POST',
        // only send body if you actually use makeAvailable on backend
        body:
          typeof makeAvailable === 'boolean' ? { makeAvailable } : undefined,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // POST /api/table/mark-occupied/:id
    markOccupied: builder.mutation({
      query: (id) => ({
        url: `/mark-occupied/${id}`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // POST /api/table/mark-awaiting-payment/:id
    markAwaitingPayment: builder.mutation({
      query: (id) => ({
        url: `/mark-awaiting-payment/${id}`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),

    // GET /api/order/get-active-dine-in-order-by-table?tableId=...
    activeDineInOrderByTable: builder.query({
      query: (tableId) => ({
        // absolute URL so we can hit the /api/order route from the table slice
        url: `/get-order-by-table?tableId=${encodeURIComponent(tableId)}`,
        method: 'GET',
      }),
      transformResponse: (res) => res?.data ?? null,
      // cache by table id; also lets us invalidate via Table tags if you like
      providesTags: (result, error, tableId) => [
        { type: 'Table', id: tableId },
      ],
    }),

    // POST /api/table/mark-available/:id
    markAvailable: builder.mutation({
      query: (id) => ({
        url: `/mark-available/${id}`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Table', id },
        { type: 'Table', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreateTableMutation,
  useListTablesQuery,
  useGetTableByIdQuery,
  useUpdateTableMutation,
  useRemoveTableMutation,
  useAssignWaiterMutation,
  useClearWaiterMutation,
  useReserveTableMutation,
  useCancelReservationMutation,
  useMarkOccupiedMutation,
  useMarkAwaitingPaymentMutation,
  useMarkAvailableMutation,
  useActiveDineInOrderByTableQuery,
} = tableApi;
