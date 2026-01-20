// src/features/addressApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const addressApi = createApi({
  reducerPath: 'addressApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/address-book`, // adjust if your route prefix differs
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
  tagTypes: ['Addresses'],
  endpoints: (builder) => ({
    // GET /api/address/get-all-addresses
    getAddresses: builder.query({
      query: () => `/get-all-shippment-address`,
      transformResponse: (res) =>
        Array.isArray(res?.addresses) ? res.addresses : [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result
                .filter(Boolean)
                .map((a) => ({ type: 'Addresses', id: a._id || a.id })),
              { type: 'Addresses', id: 'LIST' },
            ]
          : [{ type: 'Addresses', id: 'LIST' }],
    }),

    // GET /api/address/get-address-by-id/:id
    getAddressById: builder.query({
      query: (id) => `/get-shippment-address-byid/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Addresses', id }],
    }),

    // POST /api/address/create-address
    createAddress: builder.mutation({
      query: (body) => ({
        url: `/create-shippment-address`,
        method: 'POST',
        body,
      }),
      transformResponse: (res) => res?.address || res,
      invalidatesTags: [{ type: 'Addresses', id: 'LIST' }],
    }),

    // PATCH /api/address/update-address/:id
    updateAddress: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/update-shippment-address-byid/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res) => res?.address || res,
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Addresses', id },
        { type: 'Addresses', id: 'LIST' },
      ],
    }),

    // DELETE /api/address/delete-address/:id
    deleteAddress: builder.mutation({
      query: (id) => ({
        url: `/delete-shippment-address-byid/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Addresses', id },
        { type: 'Addresses', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useGetAddressByIdQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = addressApi;
