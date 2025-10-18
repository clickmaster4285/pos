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

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/product`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    // POST /api/product/create-product
    createProduct: builder.mutation({
      query: (body) => ({ url: '/create-product', method: 'POST', body }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /api/product/get-all-product
    getAllProducts: builder.query({
      query: () => '/get-all-product',
      transformResponse: (res) => res.data || res,
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'Product', id: p._id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    // PATCH /api/product/update-product/:id
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

    // DELETE /api/product/delete-product/:id
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/delete-product/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // PATCH /api/product/status-update-product/:id
    toggleProductStatus: builder.mutation({
      query: (id) => ({ url: `/status-update-product/${id}`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // PATCH /api/product/update-product-stock
    updateProductStock: builder.mutation({
      query: (stockData) => ({
        url: '/update-product-stock',
        method: 'PATCH',
        body: { stockData },
      }),
      invalidatesTags: (result, error, stockData) => [
        { type: 'Product', id: 'LIST' },
        ...(stockData?.map((item) => ({ type: 'Product', id: item.productId })) || []),
      ],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleProductStatusMutation,
  useUpdateProductStockMutation,
} = productApi;