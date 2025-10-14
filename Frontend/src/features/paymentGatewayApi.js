import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3455'
).replace(/\/$/, '');

export const paymentGatewayApi = createApi({
  reducerPath: 'paymentGatewayApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/strip`,
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
        url: '/create-payment-intent',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useCreatePaymentIntentMutation } = paymentGatewayApi;