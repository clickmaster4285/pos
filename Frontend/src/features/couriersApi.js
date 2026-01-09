// src/features/couriersApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const couriersApi = createApi({
  reducerPath: 'couriersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/courier`,
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
  tagTypes: ['Couriers'],
  endpoints: (builder) => ({
    /* ======= LIST ======= */
    // GET /api/couriers?q=&environment=&status=&includeDeleted=&page=&limit=&sort=&companyId=
    getCouriers: builder.query({
      query: (params = {}) => ({
        url: `/get-all-courier`,
        params,
      }),
      // controller returns { success, data: [...], pagination: {...} }
      transformResponse: (res) =>
        Array.isArray(res?.data)
          ? res
          : { data: res?.data ?? [], pagination: res?.pagination },
      providesTags: (result) =>
        Array.isArray(result?.data)
          ? [
              ...result.data.map((c) => ({
                type: 'Couriers',
                id: c._id || c.id || c.code,
              })),
              { type: 'Couriers', id: 'LIST' },
            ]
          : [{ type: 'Couriers', id: 'LIST' }],
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    /* ======= READ ======= */
    // GET /api/couriers/:id?companyId=...
    getCourierById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/get-courier-by-id/${id}`,
        params: companyId ? { companyId } : undefined,
      }),
      providesTags: (_res, _err, arg) => [{ type: 'Couriers', id: arg?.id }],
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    /* ======= CREATE ======= */
    // POST /api/couriers
    createCourier: builder.mutation({
      query: (body) => ({
        url: `/create-courier`,
        method: 'POST',
        body, // must include companyId + name (+ optional fields)
      }),
      invalidatesTags: [{ type: 'Couriers', id: 'LIST' }],
    }),

    /* ======= UPDATE (fields) ======= */
    // PATCH /api/couriers/:id
    updateCourier: builder.mutation({
      query: ({ id, ...rest }) => ({
        url: `/update-courier/${id}`,
        method: 'PATCH',
        body: rest, // name, environment, supportsCOD, status, isActive, ...
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Couriers', id },
        { type: 'Couriers', id: 'LIST' },
      ],
    }),

    /* ======= CREDENTIALS ======= */
    // PATCH /api/couriers/:id/credentials
    updateCourierCredentials: builder.mutation({
      query: ({ id, ...creds }) => ({
        url: `/update-credentials/${id}`,
        method: 'PATCH',
        body: creds, // baseUrl, clientId, clientSecret, apiKey, username, password, scope, environment
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Couriers', id },
        { type: 'Couriers', id: 'LIST' },
      ],
    }),

    /* ======= AUTH TEST ======= */
    // POST /api/couriers/:id/auth-test
    authTestCourier: builder.mutation({
      query: ({ id, ok, companyId }) => ({
        url: `/auth-test/${id}`,
        method: 'POST',
        body: typeof ok === 'boolean' ? { ok } : {}, // optional override
        params: companyId ? { companyId } : undefined,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Couriers', id },
        { type: 'Couriers', id: 'LIST' },
      ],
    }),

    /* ======= SOFT DELETE ======= */
    // DELETE /api/couriers/:id  (soft delete)
    deleteCourier: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/delete-courier/${id}`,
        method: 'DELETE',
        params: companyId ? { companyId } : undefined,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Couriers', id },
        { type: 'Couriers', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCouriersQuery,

  useGetCourierByIdQuery,

  useCreateCourierMutation,
  useUpdateCourierMutation,

  useUpdateCourierCredentialsMutation,

  useAuthTestCourierMutation,

  useDeleteCourierMutation,
} = couriersApi;
