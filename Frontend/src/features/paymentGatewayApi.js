import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3455'
).replace(/\/$/, '');

export const paymentGatewayApi = createApi({
  reducerPath: 'paymentGatewayApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
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
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation({
      query: (body) => ({
        url: '/strip/create-payment-intent',
        method: 'POST',
        body,
      }),
    }),
    stripConfiguration: builder.mutation({
      query: (body) => ({
        url: '/user/add-strip-configuration',
        method: 'PUT',
        body,
      }),
    }),
    getStripPublishKey: builder.query({
      query: () => ({
        url: "/strip/get-strip-publishkey",
        method: "GET",
      }),
    }),
  }),
});

export const { useCreatePaymentIntentMutation, useStripConfigurationMutation, useGetStripPublishKeyQuery} = paymentGatewayApi;