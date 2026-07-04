// src/features/branchesApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const branchesApi = createApi({
   reducerPath: 'branchesApi',
   baseQuery: fetchBaseQuery({
      baseUrl: `${API_URL}/api/branches`,
      credentials: 'include',
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
   tagTypes: ['Branches', 'BranchDetails'],
   endpoints: (builder) => ({

      // ========== BRANCH CRUD OPERATIONS ==========

      // POST /api/branches/ - Create new branch
      createBranch: builder.mutation({
         query: (branchData) => ({
            url: '/',
            method: 'POST',
            body: branchData,
         }),
         invalidatesTags: [{ type: 'Branches', id: 'LIST' }],
      }),

      // GET /api/branches/ - Get all branches (with filters)
      getBranches: builder.query({
         query: ({
            companyId,
            page = 1,
            limit = 20,
            status,
            city,
            type,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            lightweight = false
         }) => ({
            url: '/',
            params: {
               companyId,
               page,
               limit,
               status,
               city,
               type,
               search,
               sortBy,
               sortOrder,
               lightweight
            },
         }),
         providesTags: (result) =>
            result?.data
               ? [
                  ...result.data.map(({ branchId }) => ({
                     type: 'Branches',
                     id: branchId
                  })),
                  { type: 'Branches', id: 'LIST' }
               ]
               : [{ type: 'Branches', id: 'LIST' }],
      }),

      // GET /api/branches/:id - Get branch by ID
      getBranchById: builder.query({
         query: (id) => `/${id}`,
         providesTags: (result, error, id) => [
            { type: 'BranchDetails', id },
            { type: 'Branches', id }
         ],
      }),

      // PUT /api/branches/:id - Update branch
      updateBranch: builder.mutation({
         query: ({ id, ...patch }) => ({
            url: `/${id}`,
            method: 'PUT',
            body: patch,
         }),
         invalidatesTags: (result, error, { id }) => [
            { type: 'BranchDetails', id },
            { type: 'Branches', id },
            { type: 'Branches', id: 'LIST' }
         ],
      }),

      // DELETE /api/branches/:id - Soft delete branch
      deleteBranch: builder.mutation({
         query: ({ id, reason }) => ({
            url: `/${id}`,
            method: 'DELETE',
            body: { reason },
         }),
         invalidatesTags: [{ type: 'Branches', id: 'LIST' }],
      }),

      // POST /api/branches/:id/restore - Restore deleted branch
      restoreBranch: builder.mutation({
         query: (id) => ({
            url: `/${id}/restore`,
            method: 'POST',
         }),
         invalidatesTags: [{ type: 'Branches', id: 'LIST' }],
      }),

      // ========== UTILITY ENDPOINTS ==========

      // GET all active branches (lightweight for dropdowns)
      getActiveBranches: builder.query({
         query: (companyId) => ({
            url: '/',
            params: {
               companyId,
               status: 'active',
               lightweight: true,
               limit: 100
            },
         }),
         transformResponse: (response) => ({
            data: response.data || [],
            pagination: response.pagination || {}
         }),
         providesTags: [{ type: 'Branches', id: 'ACTIVE_LIST' }],
      }),

      // Validate branch code uniqueness
      validateBranchCode: builder.query({
         query: ({ companyId, branchCode }) => ({
            url: '/',
            params: {
               companyId,
               search: branchCode,
               lightweight: true
            },
         }),
         transformResponse: (response) => ({
            isUnique: !response.data?.some(branch =>
               branch.branchCode === branchCode || branch.branchId === branchCode
            )
         }),
      }),
   }),
});

// Export hooks
export const {
   // CRUD Operations
   useCreateBranchMutation,
   useGetBranchesQuery, // Changed from useGetCompanyBranchesQuery
   useGetBranchByIdQuery,
   useUpdateBranchMutation,
   useDeleteBranchMutation,
   useRestoreBranchMutation,

   // Utility
   useGetActiveBranchesQuery,
   useValidateBranchCodeQuery,

   // Lazy queries
   useLazyGetBranchesQuery,
   useLazyGetBranchByIdQuery,
   useLazyGetActiveBranchesQuery,
   useLazyValidateBranchCodeQuery,
} = branchesApi;