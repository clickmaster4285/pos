import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL =process.env.NEXT_PUBLIC_API_URL


export const landingApi = createApi({
  reducerPath: 'landingApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/api/landing` }),
  endpoints: (builder) => ({
    getLandingData: builder.query({
      query: () => '/get-tool-name-logo',
    }),
  }),
});

export const { useGetLandingDataQuery } = landingApi;
