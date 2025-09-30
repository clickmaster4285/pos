// src/features/inventoryApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3455'
).replace(/\/$/, '');

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/inventory`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token =
        getState()?.auth?.token ||
        (typeof window !== 'undefined' &&
          (sessionStorage.getItem('authToken') ||
            localStorage.getItem('accessToken'))) ||
        null;

      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Inventory'],
  endpoints: (builder) => ({
    // GET /api/inventory/get-all-inventories
    getInventory: builder.query({
      query: () => `/get-all-inventories`,
      transformResponse: (res) =>
        Array.isArray(res?.inventoryItems) ? res.inventoryItems : [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((i) => ({ type: 'Inventory', id: i._id || i.id })),
              { type: 'Inventory', id: 'LIST' },
            ]
          : [{ type: 'Inventory', id: 'LIST' }],
    }),

    // GET /api/inventory/get-inventory-by-id/:id
    getInventoryById: builder.query({
      query: (id) => `/get-inventory-by-id/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Inventory', id }],
    }),

    // POST /api/inventory/create-inventory
    createInventoryItem: builder.mutation({
      query: (body) => ({
        url: `/create-inventory`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),

    // PATCH /api/inventory/update-info-inventory/:id
    updateInventoryInfo: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/update-info-inventory/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    // PUT /api/inventory/add-stock-inventory/:id
    addStock: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/add-stock-inventory/${id}`,
        method: 'PUT',
        body, // { variants: [...], reason, source, comments }
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    // PATCH /api/inventory/update-inventory-item/:id  (history-based updater)
    updateInventoryItem: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/update-inventory-item/${id}`,
        method: 'PATCH',
        body: patch, // supports ?historyId=... via fetchBaseQuery params if you prefer
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    // DELETE /api/inventory/delete-inventory-item/:id
    deleteInventoryItem: builder.mutation({
      query: (id) => ({
        url: `/delete-inventory-item/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useGetInventoryByIdQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryInfoMutation,
  useAddStockMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
} = inventoryApi;
