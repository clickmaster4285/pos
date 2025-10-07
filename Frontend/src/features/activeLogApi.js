// src/features/activity/activityApi.js
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

const buildParams = (p = {}) => {
  const out = {};
  if (p.companyId) out.companyId = p.companyId;
  if (p.from) out.from = p.from;
  if (p.to) out.to = p.to;
  if (p.entities)
    out.entities = Array.isArray(p.entities)
      ? p.entities.join(',')
      : p.entities;
  if (p.actions)
    out.actions = Array.isArray(p.actions) ? p.actions.join(',') : p.actions;
  if (p.page) out.page = p.page;
  if (p.limit) out.limit = p.limit;
  if (p.debug) out.debug = p.debug;
  return out;
};

export const activityApi = createApi({
  reducerPath: 'activityApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/activity`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Activity'],
  endpoints: (builder) => ({
    getAllActivity: builder.query({
      query: (params = {}) => ({
        url: '/all-activity',
        params: buildParams(params),
      }),
      transformResponse: (res) => res,
      providesTags: [{ type: 'Activity', id: 'ALL' }],
      // 👇 auto refresh on focus/reconnect
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),

    getActivityByUser: builder.query({
      query: ({ userId, ...params }) => {
        return {
          url: `/activity-by-userId/${encodeURIComponent(userId)}`,
          params: buildParams(params),
        };
      },
      transformResponse: (res) => res,
      providesTags: (result, error, arg) => [
        { type: 'Activity', id: `USER-${arg.userId}` },
      ],
      // 👇 auto refresh on focus/reconnect
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),
  }),
});

export const {
  useGetAllActivityQuery,
  useLazyGetAllActivityQuery,
  useGetActivityByUserQuery,
  useLazyGetActivityByUserQuery,
} = activityApi;
