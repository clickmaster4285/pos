// companyApi.js
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

export const companyApi = createApi({
  reducerPath: 'companyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/company`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
    responseHandler: async (response) => {
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        return { ...parsed, status: response.status }; // Include status
      } catch {
        return {
          status: response.status,
          message: text,
          isHtml: text.startsWith('<!DOCTYPE html>'),
        };
      }
    },
    fetchFn: async (input, init) => {
      try {
        const isReq = input instanceof Request;
        const method = init?.method || (isReq ? input.method : 'GET');
        const url = isReq ? input.url : String(input);
        console.log('[companyApi]', method, url);
      } catch {}
      return fetch(input, init);
    },
  }),
  tagTypes: ['Company', 'User'],
  endpoints: (builder) => ({
    createCompany: builder.mutation({
      query: (body) => ({
        url: '/create-company',
        method: 'POST',
        body,
      }),
      transformResponse: (res, meta) => {
        if (res?.success && res?.data)
          return { ...res, status: meta?.response?.status || 201 };
        if (res && res._id)
          return { ...res, status: meta?.response?.status || 201 };
        throw {
          message: res?.message || 'Failed to create company',
          status: meta?.response?.status || 400,
        };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      invalidatesTags: [{ type: 'Company', id: 'LIST' }],
    }),

    getAllCompanies: builder.query({
      query: () => '/get-all-company',
      transformResponse: (res, meta) => {
        if (res?.success && Array.isArray(res.data))
          return { ...res, status: meta?.response?.status || 200 };
        if (Array.isArray(res))
          return { data: res, status: meta?.response?.status || 200 };
        throw {
          message: res?.message || 'Failed to fetch companies',
          status: meta?.response?.status || 400,
        };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((c) => ({ type: 'Company', id: c._id })),
              { type: 'Company', id: 'LIST' },
            ]
          : [{ type: 'Company', id: 'LIST' }],
    }),

    verifyCompanyAdmin: builder.mutation({
      query: ({ id, action }) => ({
        url: `/verify-company_admin?id=${encodeURIComponent(
          id
        )}&action=${encodeURIComponent(action)}`,
        method: 'PUT',
        body: { confirm: true },
      }),
      transformResponse: (res, meta) => {
        if (!res?.success)
          throw {
            message: res?.error || res?.message || 'Verification failed',
            status: meta?.response?.status || 400,
          };
        return { ...res, status: meta?.response?.status || 200 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      invalidatesTags: (result, _error, { id }) =>
        result
          ? [
              { type: 'User', id: String(id) },
              { type: 'User', id: 'LIST' },
              { type: 'Company', id: 'LIST' },
            ]
          : [],
    }),

    verifyEmailCode: builder.mutation({
      query: ({ email, otp }) => ({
        url: '/verify-email-admin',
        method: 'POST',
        body: { email, otp },
      }),
      transformResponse: (res, meta) => {
        if (!res?.success)
          throw {
            message: res?.error || res?.message || 'Verification failed',
            status: meta?.response?.status || 400,
          };
        return { ...res, status: meta?.response?.status || 200 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    resendVerificationCode: builder.mutation({
      query: ({ email }) => ({
        url: '/resend-code',
        method: 'POST',
        body: { email },
      }),
      transformResponse: (res, meta) => {
        if (!res?.success)
          throw {
            message: res?.error || res?.message || 'Failed to resend code',
            status: meta?.response?.status || 400,
          };
        return { ...res, status: meta?.response?.status || 200 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
    }),

    toggleCompanyStatus: builder.mutation({
      query: (id) => ({ url: `/status-update-company/${id}`, method: 'PATCH' }),
      transformResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 200,
      }),
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Company', id }],
    }),
    getCompany: builder.query({
      query: () => `/get-company`,
      transformResponse: (res, meta) => {
        // console.log("tehres?.success aer:  ",res)
        if (res?.success && res?.data)
          return { ...res, status: meta?.response?.status || 200 };
        if (res && res._id)
          return { ...res, status: meta?.response?.status || 200 };
        throw {
          message: res?.message || 'Failed to fetch company',
          status: meta?.response?.status || 400,
        };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      providesTags: (result, error, id) => [{ type: 'Company', id }],
    }),
  }),
});

export const {
  useGetAllCompaniesQuery,
  useVerifyCompanyAdminMutation,
  useCreateCompanyMutation,
  useVerifyEmailCodeMutation,
  useResendVerificationCodeMutation,
  useToggleCompanyStatusMutation,
  useGetCompanyQuery,
} = companyApi;