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
      if (token) headers.set('Authorization', `Bearer ${token}`);
      // Note: Content-Type is not set here; FormData sets multipart/form-data automatically
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
          isHtml: text.startsWith('<!DOCTYPE html>'),
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
    getCompanySettings: builder.query({
      query: () => `/get-company`,
      transformResponse: (res, meta) => {
        // console.log('Raw response from getCompanySettings:', res);
        if (res?.success && res?.data?.invoiceSettings) {
          return { invoiceSettings: res.data.invoiceSettings, companyInfo:{companyName: res.data.name, companyLogo: res.data.companyLogo}, status: meta?.response?.status || 200 };
        }
        throw { message: res?.message || 'Failed to fetch settings', status: meta?.response?.status || 400 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      providesTags: (result, error) => [{ type: 'Settings' }],
    }),
    updateCompanySettings: builder.mutation({
      query: ({ companyId, settings, logoFile }) => {
        const formData = new FormData();
        // Append settings as a JSON string
        formData.append('settings', JSON.stringify(settings));
        // Append logo file if provided
        if (logoFile) {
          formData.append('companyLogo', logoFile);
        }
        return {
          url: `/update-company-settings`,
          method: 'PUT',
          body: formData,
        };
      },
      transformResponse: (res, meta) => {
        if (res?.success && res?.companySettings) {
          return { companySettings: res.companySettings, status: meta?.response?.status || 200 };
        }
        throw { message: res?.message || 'Failed to update company settings', status: meta?.response?.status || 400 };
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
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
} = settingsApi;