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

export const vendorApi = createApi({
  reducerPath: 'vendorApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/vendor`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Vendor'],
  endpoints: (builder) => ({
    // POST /api/vendor/create-vendor
    createVendor: builder.mutation({
      query: (body) => ({ url: '/create-vendor', method: 'POST', body }),
      invalidatesTags: [{ type: 'Vendor', id: 'LIST' }],
    }),

    // GET /api/vendor/get-all-vendors
    getAllVendors: builder.query({
      query: () => '/get-all-vendors',
      transformResponse: (res) => res, // keep if backend already returns an array
      providesTags: (result) =>
        result
          ? [
              ...result.map((v) => ({ type: 'Vendor', id: v._id })),
              { type: 'Vendor', id: 'LIST' },
            ]
          : [{ type: 'Vendor', id: 'LIST' }],
    }),

    // GET /api/vendor/get-vendors-by-id/:id
    getVendorById: builder.query({
      query: (id) => `/get-vendors-by-id/${id}`,
      providesTags: (result, error, id) => [{ type: 'Vendor', id }],
    }),

    // PUT /api/vendor/update-vendor/:id
    updateVendor: builder.mutation({
      query: ({ id, ...body }) => {
        console.log('id', id, 'body', body);
        return {
          url: `/update-vendor/${id}`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Vendor', id },
        { type: 'Vendor', id: 'LIST' },
      ],
    }),

    // DELETE /api/vendor/delete-vendor/:id
    deleteVendor: builder.mutation({
      
      query: (id) => {
       

        return {
          url: `/delete-vendor/${id}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: [{ type: 'Vendor', id: 'LIST' }],
    }),

    // PATCH /api/vendor/status-update-vendor/:id
    toggleVendorStatus: builder.mutation({
      query: (id) => ({ url: `/status-update-vendor/${id}`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Vendor', id }],
    }),
  }),
});

export const {
  useCreateVendorMutation,
  useGetAllVendorsQuery,
  useGetVendorByIdQuery,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useToggleVendorStatusMutation,
} = vendorApi;
