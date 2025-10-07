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

export const StaffSalary = createApi({
  reducerPath: 'StaffSalary',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/staff-salary`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Salary'],
  endpoints: (builder) => ({
    // POST /api/payroll/pay
    createPayment: builder.mutation({
      query: (body) => ({ url: '/create-payment', method: 'POST', body }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: [{ type: 'Salary', id: 'LIST' }],
    }),

    // GET /api/payroll/payments?companyId=&staffId=&month=&type=&page=&limit=
    getAllPaymentsInfo: builder.query({
      query: (params) => ({
        url: '/all-staff-salaries',
        params,
      }),
      transformResponse: (res) => res?.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((row) => ({ type: 'Salary', id: row._id })),
              { type: 'Salary', id: 'LIST' },
            ]
          : [{ type: 'Salary', id: 'LIST' }],
    }),

    // Get all payment summay = history
    getAllPaymentsSummary: builder.query({
      query: (params) => ({
        url: '/payments/grouped',
        params,
      }),
      transformResponse: (res) => res?.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((row) => ({ type: 'Salary', id: row._id })),
              { type: 'Salary', id: 'LIST' },
            ]
          : [{ type: 'Salary', id: 'LIST' }],
    }),

    //Update base salary
    updateSalary: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/update-base-salary/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Salary', id },
        { type: 'Salary', id: 'LIST' },
      ],
    }),

    // PATCH /api/payroll/payments/:id/soft-delete
    deleteSalary: builder.mutation({
      query: ({ id, companyId, reason }) => ({
        url: `/delete-payment/${id}`,
        method: 'DELETE',
        body: { companyId, reason },
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: [{ type: 'Salary', id: 'LIST' }],
    }),

    // OPTIONAL: one staff snapshot
    // GET /api/payroll/staff/:staffId/summary?companyId=&month=&limit=
    getStaffSummary: builder.query({
      query: ({ staffId, ...params }) => ({
        url: `/staff-summary/${staffId}`,
        params,
      }),
      transformResponse: (res) => res?.data ?? res,
      providesTags: (result, error, { staffId }) => [
        { type: 'Salary', id: staffId },
        { type: 'Salary', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreatePaymentMutation,
  useGetAllPaymentsInfoQuery,
  useGetAllPaymentsSummaryQuery,
  useUpdateSalaryMutation,
  useDeleteSalaryMutation,
  useGetStaffSummaryQuery,
} = StaffSalary;
