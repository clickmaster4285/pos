// settingsApi.js
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

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
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
        return { ...parsed, status: response.status };
      } catch {
        return {
          status: response.status,
          message: text,
          isHtml: text.startsWith("<!DOCTYPE html>"),
        };
      }
    },
    fetchFn: async (input, init) => {
      try {
        const isReq = input instanceof Request;
        const method = init?.method || (isReq ? input.method : 'GET');
        const url = isReq ? input.url : String(input);
        console.log('[settingsApi]', method, url);
      } catch {}
      return fetch(input, init);
    },
  }),
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    getInvoiceSettings: builder.query({
      query: (companyId) => `/${companyId}`,
      transformResponse: (res, meta) => {
        if (res?.success && res?.data?.invoiceSettings) {
          return { invoiceSettings: res.data.invoiceSettings, status: meta?.response?.status || 200 };
        }
        if (res?.invoiceSettings) {
          return { invoiceSettings: res.invoiceSettings, status: meta?.response?.status || 200 };
        }
        throw { message: res?.message || 'Failed to fetch invoice settings', status: meta?.response?.status || 400 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      providesTags: (result, error, companyId) => [{ type: 'Settings', id: companyId }],
    }),
    updateInvoiceSettings: builder.mutation({
      query: ({ companyId, settings }) => ({
        url: `/update-invoice-settings`,
        method: 'PUT',
        body: settings,
      }),
      transformResponse: (res, meta) => {
        if (res?.success && res?.invoiceSettings) {
          return { invoiceSettings: res.invoiceSettings, status: meta?.response?.status || 200 };
        }
        throw { message: res?.message || 'Failed to update invoice settings', status: meta?.response?.status || 400 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      invalidatesTags: (result, error, { companyId }) => [{ type: 'Settings', id: companyId }],
    }),
  }),
});

export const {
  useGetInvoiceSettingsQuery,
  useUpdateInvoiceSettingsMutation,
} = settingsApi;
