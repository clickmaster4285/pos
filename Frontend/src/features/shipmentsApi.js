// src/features/shipmentsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const shipmentsApi = createApi({
  reducerPath: 'shipmentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/shippment`,
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
  tagTypes: ['Shipments'],
  endpoints: (builder) => ({
    /* ======= LIST ======= */
    // GET /api/shipments?q=&status=&courierId=&from=&to=&deleted=&page=&limit=&sort=
    getShipments: builder.query({
      query: () => `/get-all-shipments`,
      transformResponse: (res) =>
        Array.isArray(res?.data)
          ? res
          : { data: res?.data ?? [], meta: res?.meta },
      providesTags: (result) =>
        Array.isArray(result?.data)
          ? [
              ...result.data.map((s) => ({
                type: 'Shipments',
                id: s._id || s.id || s.awb,
              })),
              { type: 'Shipments', id: 'LIST' },
            ]
          : [{ type: 'Shipments', id: 'LIST' }],
    }),

    /* ======= READ ======= */
    // GET /api/shipments/:id
    getShipmentById: builder.query({
      query: (id) => `/get-shippment-by-id/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Shipments', id }],
    }),

    /* ======= CREATE (AWB auto-generated server-side) ======= */
    // POST /api/shipments
    createShipment: builder.mutation({
      query: (body) => ({
        url: `/create-shippment`,
        method: 'POST',
        body, // server generates AWB if omitted
      }),
      invalidatesTags: [{ type: 'Shipments', id: 'LIST' }],
    }),

    /* ======= UPDATE FIELDS (not status) ======= */
    // PATCH /api/shipments/:id
    updateShipment: builder.mutation({
      query: ({ id, ...rest }) => ({
        url: `/update-shippment/${id}`,
        method: 'PATCH',
        body: rest, // courierId, toAddress, dimensions, etc.
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Shipments', id },
        { type: 'Shipments', id: 'LIST' },
      ],
    }),

    /* ======= STATUS CHANGE ======= */
    // PATCH /api/shipments/:id/status
    updateShipmentStatus: builder.mutation({
      query: ({ id, ...rest }) => {
        return {
          url: `/update-shippment-status/${id}`,
          method: 'PATCH',
          body: rest, // { rawStatus } or { normalized } plus optional description/location/ts
        };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Shipments', id },
        { type: 'Shipments', id: 'LIST' },
      ],
    }),

    /* ======= CANCEL ======= */
    // PATCH /api/shipments/:id/cancel
    cancelShipment: builder.mutation({
      query: (id) => {
        console.log('id is', id);
        return {
          url: `/cancel-shippment/${id}`,
          method: 'PATCH',
        };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Shipments', id },
        { type: 'Shipments', id: 'LIST' },
      ],
    }),

    /* ======= SOFT DELETE / RESTORE ======= */
    // PATCH /api/shipments/:id/soft-delete
    softDeleteShipment: builder.mutation({
      query: (id) => ({
        url: `/soft-delete-shippment/${id}`,
        method: 'PATCH',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Shipments', id },
        { type: 'Shipments', id: 'LIST' },
      ],
    }),

    // PATCH /api/shipments/:id/restore
    restoreShipment: builder.mutation({
      query: (id) => ({
        url: `restore-shippment/${id}`,
        method: 'PATCH',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Shipments', id },
        { type: 'Shipments', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetShipmentsQuery,
  useGetShipmentByIdQuery,

  useCreateShipmentMutation,
  useUpdateShipmentMutation,
  useUpdateShipmentStatusMutation,

  useCancelShipmentMutation,
  useSoftDeleteShipmentMutation,
  useRestoreShipmentMutation,
} = shipmentsApi;
