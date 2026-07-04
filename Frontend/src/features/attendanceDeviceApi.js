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

export const attendanceDeviceApi = createApi({
  reducerPath: 'attendanceDeviceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/attendance-device`,
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
      } catch {}
      return fetch(input, init);
    },
  }),
  tagTypes: ['AttendanceDevice'],
  endpoints: (builder) => ({
    getAllDevices: builder.query({
      query: () => '/get-all-devices',
      transformResponse: (res, meta) => {
        if (res?.success && Array.isArray(res.data)) return { ...res, status: meta?.response?.status || 200 };
        if (Array.isArray(res)) return { data: res, status: meta?.response?.status || 200 };
        throw { message: res?.message || 'Failed to fetch devices', status: meta?.response?.status || 400 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((d) => ({ type: 'AttendanceDevice', id: d._id })),
              { type: 'AttendanceDevice', id: 'LIST' },
            ]
          : [{ type: 'AttendanceDevice', id: 'LIST' }],
    }),
    createDevice: builder.mutation({
      query: (body) => ({
        url: '/create-device',
        method: 'POST',
        body,
      }),
      transformResponse: (res, meta) => {
        if (res?.success && res?.device) return { ...res, status: meta?.response?.status || 201 };
        if (res && res.device) return { ...res, status: meta?.response?.status || 201 };
        throw { message: res?.message || 'Failed to create device', status: meta?.response?.status || 400 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      invalidatesTags: [{ type: 'AttendanceDevice', id: 'LIST' }],
    }),
    connectDevice: builder.mutation({
      query: (deviceId) => ({
        url: `/connect-device/${encodeURIComponent(deviceId)}`,
        method: 'PUT',
      }),
      transformResponse: (res, meta) => {
        if (!res?.success)
          throw { message: res?.message || 'Failed to connect device', status: meta?.response?.status || 400 };
        return { ...res, status: meta?.response?.status || 200 };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
      invalidatesTags: (result, _error, deviceId) => [
        { type: 'AttendanceDevice', id: deviceId },
        { type: 'AttendanceDevice', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAllDevicesQuery,
  useCreateDeviceMutation,
  useConnectDeviceMutation,
} = attendanceDeviceApi;