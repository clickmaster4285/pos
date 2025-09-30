import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '') // ← empty lets us use relative paths (works with Next rewrites)
  .replace(/\/$/, '');

const getToken = (getState) =>
  getState()?.auth?.token ||
  (typeof window !== 'undefined' && sessionStorage.getItem('authToken')) ||
  (typeof document !== 'undefined' &&
    document.cookie
      .split('; ')
      .find((r) => r.startsWith('authToken='))
      ?.split('=')[1]) ||
  null;

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/user`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
    // Better logger: shows HTTP method + URL for debugging
    fetchFn: async (input, init) => {
      try {
        const isReq = input instanceof Request;
        const method = init?.method || (isReq ? input.method : 'GET');
        const url = isReq ? input.url : String(input);
        console.log('[staffApi]', method, url);
      } catch {}
      return fetch(input, init);
    },
  }),
  tagTypes: ['Staff'],
  endpoints: (builder) => ({
    /** GET /api/user/get-all-staff */
    getAllStaff: builder.query({
  query: () => '/get-all-staff',
  transformResponse: (res) => {
    console.log('[staffApi] getAllStaff response:', res);
    if (res?.success && Array.isArray(res.data)) return res.data;
    throw new Error(res?.message || 'Failed to fetch staff');
  },
  providesTags: (result) =>
    result
      ? [
          ...result.map((s) => ({ type: 'Staff', id: s._id })),
          { type: 'Staff', id: 'LIST' },
        ]
      : [{ type: 'Staff', id: 'LIST' }],
}),


    /** POST /api/user/create-staff */
    createStaff: builder.mutation({
      query: (staffData) => ({
        url: '/create-staff',
        method: 'POST',
        body: staffData,
      }),
      transformResponse: (res) => {
        console.log('[staffApi] createStaff response:', res);
        if (res?.success && res.data) return res.data;
        if (res && res._id) return res;
        throw new Error(res?.message || 'Failed to create staff');
      },
      invalidatesTags: [{ type: 'Staff', id: 'LIST' }],
    }),

    /** PUT /api/user/update-staff/:id */
    updateStaff: builder.mutation({
      query: ({ _id, ...staffData }) => ({
        url: `/update-staff-byid/${_id}`,
        method: 'PATCH',
        body: staffData,
      }),
      transformResponse: (res) => {
        console.log('[staffApi] updateStaff response:', res);
        if (res?.success && res.data) return res.data;
        if (res && res._id) return res;
        throw new Error(res?.message || 'Failed to update staff');
      },
      invalidatesTags: (result, _error, { _id }) =>
        result
          ? [
              { type: 'Staff', id: _id },
              { type: 'Staff', id: 'LIST' },
            ]
          : [],
    }),

    /** DELETE /api/user/delete-staff/:id */
    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `/delete-staff/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => {
        console.log('[staffApi] deleteStaff response:', res);
        if (!res?.success) throw new Error(res?.message || 'Failed to delete staff');
        return res;
      },
      invalidatesTags: (result, _error, id) =>
        result
          ? [
              { type: 'Staff', id },
              { type: 'Staff', id: 'LIST' },
            ]
          : [],
    }),
  }),
});

export const {
  useGetAllStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} = staffApi;
