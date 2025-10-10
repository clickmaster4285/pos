import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '') // empty → relative paths, works with Next rewrites
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

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/user`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
    fetchFn: async (input, init) => {
      try {
        const isReq = input instanceof Request;
        const method = init?.method || (isReq ? input.method : 'GET');
        const url = isReq ? input.url : String(input);
      } catch {}
      return fetch(input, init);
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    /** GET /api/user/get-all-users */
    getAllUsers: builder.query({
      query: () => '/get-all-users',
      transformResponse: (res) => {
        if (res?.success && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: 'User', id: u._id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    /** GET /api/user/get-all-customer-users */
    getAllCustomerUsers: builder.query({
      query: () => '/get-all-customer-users',
      transformResponse: (res) => {
        if (res?.success && Array.isArray(res.users)) return res.users;
        if (Array.isArray(res)) return res;
        throw new Error(res?.message || 'Failed to fetch customer users');
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: 'User', id: u._id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    /** PATCH /api/user/toggle-user-status/:userId */
    toggleUserStatus: builder.mutation({
      query: (userId) => ({
        url: `/active_inactive-user/${userId}`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
      ],
    }),
  }),
});

export const { useGetAllUsersQuery, useGetAllCustomerUsersQuery, useToggleUserStatusMutation } = userApi;