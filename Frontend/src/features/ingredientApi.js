// src/features/ingredientApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const getToken = (getState) =>
  getState()?.auth?.token ||
  (typeof window !== 'undefined' && sessionStorage.getItem('authToken')) ||
  null;

export const ingredientApi = createApi({
  reducerPath: 'ingredientApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/ingredient`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Ingredient'],
  endpoints: (builder) => ({
    createIngredient: builder.mutation({
  query: (body) => {
    console.log("Creating ingredient with data:", body);
    return {
      url: '/create-ingredient',
      method: 'POST',
      body,
    };
  },
  invalidatesTags: [{ type: 'Ingredient', id: 'LIST' }],
}),


    getAllIngredients: builder.query({
      query: ({ page = 1, limit = 10, category } = {}) => ({
        url: '/get-all-ingredient',
        params: { page, limit, category },
      }),
      transformResponse: (res) => ({
        data: res.data || [],
        pagination: res.pagination || { page: 1, totalPages: 1, total: 0 },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((i) => ({ type: 'Ingredient', id: i._id })),
              { type: 'Ingredient', id: 'LIST' },
            ]
          : [{ type: 'Ingredient', id: 'LIST' }],
    }),

    getIngredientById: builder.query({
      query: (id) => `/get-ingredient-by-id/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Ingredient', id }],
    }),

    updateIngredient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/update-ingredient/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Ingredient', id },
        { type: 'Ingredient', id: 'LIST' },
      ],
    }),

    deleteIngredient: builder.mutation({
      query: (id) => ({
        url: `/delete-ingredient/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Ingredient', id: 'LIST' }],
    }),

    toggleIngredientStatus: builder.mutation({
      query: (id) => ({ url: `/status-update-ingredient/${id}`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Ingredient', id }],
    }),

    updateIngredientStock: builder.mutation({
      query: (stockData) => ({
        url: '/update-ingredient-stock',
        method: 'PATCH',
        body: { stockData },
      }),
      invalidatesTags: (result, error, stockData) => [
        { type: 'Ingredient', id: 'LIST' },
        ...(stockData?.map((item) => ({ type: 'Ingredient', id: item.ingredientId })) || []),
      ],
    }),
  }),
});

export const {
  useCreateIngredientMutation,
  useGetAllIngredientsQuery,
  useGetIngredientByIdQuery,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
  useToggleIngredientStatusMutation,
  useUpdateIngredientStockMutation,
} = ingredientApi;