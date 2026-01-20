import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getToken = (getState) =>
  getState()?.auth?.token ||
  (typeof window !== 'undefined' && sessionStorage.getItem('authToken')) ||
  (typeof document !== 'undefined' &&
    document.cookie
      .split('; ')
      .find((r) => r.startsWith('authToken='))
      ?.split('=')[1]) ||
  null;

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/attendance`,
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
          isHtml: text.startsWith('<!DOCTYPE html>'),
        };
      }
    },
    fetchFn: async (input, init) => {
      try {
        const isReq = input instanceof Request;
        const method = init?.method || (isReq ? input.method : 'GET');
        const url = isReq ? input.url : String(input);
        console.log('[attendanceApi]', method, url);
      } catch {}
      return fetch(input, init);
    },
  }),
  tagTypes: ['Attendance'],
  endpoints: (builder) => ({
    getAllAttendance: builder.query({
      query: () => '/get-all-attendance',
      transformResponse: (res, meta) => {
        // console.log('Raw Response:', res, 'Meta:', meta);
        if (res?.success && Array.isArray(res.data)) return { ...res, status: meta?.response?.status || 200 };
        if (Array.isArray(res)) return { data: res, status: meta?.response?.status || 200 };
        throw { message: res?.message || 'Failed to fetch attendance', status: meta?.response?.status || 400 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((d) => ({ type: 'Attendance', id: d._id })),
              { type: 'Attendance', id: 'LIST' },
            ]
          : [{ type: 'Attendance', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllAttendanceQuery,
} = attendanceApi;