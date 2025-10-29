// src/features/productApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// === CONFIG ===
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// === TOKEN HELPER ===
const getToken = (getState) => {
  const token =
    getState()?.auth?.token ||
    (typeof window !== 'undefined' && sessionStorage.getItem('authToken')) ||
    (typeof document !== 'undefined' &&
      document.cookie
        .split('; ')
        .find((r) => r.startsWith('authToken='))
        ?.split('=')[1]) ||
    null;

  return token;
};

// === BASE QUERY WITH LOGGING ===
const baseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api/product`,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getToken(getState);
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// === API DEFINITION ===
export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery, 
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    createProduct: builder.mutation({
      query: (body) => ({ url: '/create-product', method: 'POST', body }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    getAllProducts: builder.query({
      query: () => '/get-all-product',
      transformResponse: (res) => {
        return {
          data: Array.isArray(res.data) ? res.data : [],
          pagination: res.pagination || { page: 1, totalPages: 1, total: 0 },
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((p) => ({ type: 'Product', id: p._id || p.id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    getProductById: builder.query({
      query: (id) => `/get-product-by-id/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Product', id }],
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/update-product/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/delete-product/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    toggleProductStatus: builder.mutation({
      query: (id) => ({ url: `/status-update-product/${id}`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),

    updateProductStock: builder.mutation({
      query: ({ stockData }) => ({
        url: '/update-product-stock',
        method: 'PATCH',
        body: { stockData },
      }),
      invalidatesTags: (result, error, { stockData }) => [
        { type: 'Product', id: 'LIST' },
        ...(stockData?.map((item) => ({ type: 'Product', id: item.productId })) || []),
      ],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleProductStatusMutation,
  useUpdateProductStockMutation,
} = productApi;