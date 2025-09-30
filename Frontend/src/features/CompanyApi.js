import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '') // ← empty lets us use relative paths (works great with Next rewrites)
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

export const companyApi = createApi({
  reducerPath: 'companyApi',
  baseQuery: fetchBaseQuery({
    // If API_URL is empty we’ll hit the same-origin, which can be proxied via Next rewrites (see section 3)
    baseUrl: `${API_URL}/api/company`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
    // Better logger: prints true HTTP method + final URL
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
    /** POST /api/company/create-company */
    createCompany: builder.mutation({
      query: (body) => ({
        url: '/create-company',
        method: 'POST',
        body, // e.g. { name, email, phone, address, industry, size, logoUrl }
      }),
      transformResponse: (res) => {
        // Accept either { success, data } or a raw company doc
        if (res?.success && res?.data) return res.data;
        if (res && res._id) return res;
        throw new Error(res?.message || 'Failed to create company');
      },
      invalidatesTags: [{ type: 'Company', id: 'LIST' }],
    }),

    /** GET /api/company/get-all-company */
    getAllCompanies: builder.query({
      query: () => '/get-all-company',
      transformResponse: (res) => {
        if (res?.success && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
        throw new Error(res?.message || 'Failed to fetch companies');
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Company', id: c._id })),
              { type: 'Company', id: 'LIST' },
            ]
          : [{ type: 'Company', id: 'LIST' }],
    }),

    /** PUT /api/company/verify-company_admin?id=<id> */
    verifyCompanyAdmin: builder.mutation({
      query: (id) => ({
        url: `/verify-company_admin?id=${encodeURIComponent(id)}`, // EXACT path your backend expects
        method: 'PUT',
        body: { confirm: true }, // tiny body to keep it a JSON PUT
      }),
      // Surface backend errors cleanly
      transformResponse: (res) => {
        if (!res?.success)
          throw new Error(res?.error || res?.message || 'Verification failed');
        return { message: res.message, user: res.data };
      },
      invalidatesTags: (result, _error, id) =>
        result
          ? [
              { type: 'User', id },
              { type: 'User', id: 'LIST' },
              { type: 'Company', id: 'LIST' }, // triggers GET refetch of companies
            ]
          : [],
    }),
    verifyEmailCode: builder.mutation({
      query: ({ email, otp }) => ({
        url: '/verify-email-admin', // adjust if your backend path differs
        method: 'POST',
        body: { email, otp }, // <-- send OTP key the backend expects
      }),
      transformResponse: (res) => {
        if (!res?.success)
          throw new Error(res?.error || res?.message || 'Verification failed');
        return res;
      },
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    /** POST /api/company/resend-code  body: { email } */
    resendVerificationCode: builder.mutation({
      query: ({ email }) => ({
        url: '/resend-code', // <-- adjust if backend path differs
        method: 'POST',
        body: { email },
      }),
      transformResponse: (res) => {
        if (!res?.success)
          throw new Error(
            res?.error || res?.message || 'Failed to resend code'
          );
        return res;
      },
    }),

    // PATCH /api/vendor/status-update-vendor/:id
    toggleCompanyStatus: builder.mutation({
      query: (id) => ({ url: `/status-update-company/${id}`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Company', id }],
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
} = companyApi;
