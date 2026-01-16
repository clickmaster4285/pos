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
   tagTypes: ['Branches', 'BranchDetails', 'CompanyBranches', 'ManagerBranches'],
   endpoints: (builder) => ({

      // ========== BRANCH CRUD OPERATIONS ==========

      // POST /api/branches/ - Create new branch
      createBranch: builder.mutation({
         query: (branchData) => ({
            url: '/',
            method: 'POST',
            body: branchData,
         }),
         invalidatesTags: [
            { type: 'Branches', id: 'LIST' },
            { type: 'CompanyBranches', id: 'LIST' }
         ],
      }),

      // GET /api/branches/company/:companyId - Get all branches for a company
      getCompanyBranches: builder.query({
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
            url: `/company/${companyId}`,
            params: {
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
                     type: 'CompanyBranches',
                     id: branchId
                  })),
                  { type: 'CompanyBranches', id: 'LIST' }
               ]
               : [{ type: 'CompanyBranches', id: 'LIST' }],
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
            { type: 'CompanyBranches', id: 'LIST' }
         ],
      }),

      // DELETE /api/branches/:id - Soft delete branch
      deleteBranch: builder.mutation({
         query: ({ id, reason }) => ({
            url: `/${id}`,
            method: 'DELETE',
            body: { reason },
         }),
         invalidatesTags: [
            { type: 'Branches', id: 'LIST' },
            { type: 'CompanyBranches', id: 'LIST' }
         ],
      }),

      // POST /api/branches/:id/restore - Restore deleted branch
      restoreBranch: builder.mutation({
         query: (id) => ({
            url: `/${id}/restore`,
            method: 'POST',
         }),
         invalidatesTags: [
            { type: 'Branches', id: 'LIST' },
            { type: 'CompanyBranches', id: 'LIST' }
         ],
      }),

      // ========== MANAGER OPERATIONS ==========

      // POST /api/branches/:id/managers - Add manager
      addManager: builder.mutation({
         query: ({ id, userId, role }) => ({
            url: `/${id}/managers`,
            method: 'POST',
            body: { userId, role },
         }),
         invalidatesTags: (result, error, { id }) => [
            { type: 'BranchDetails', id },
            { type: 'Branches', id }
         ],
      }),

      // DELETE /api/branches/:id/managers/:userId - Remove manager
      removeManager: builder.mutation({
         query: ({ id, userId, reason }) => ({
            url: `/${id}/managers/${userId}`,
            method: 'DELETE',
            body: { reason },
         }),
         invalidatesTags: (result, error, { id }) => [
            { type: 'BranchDetails', id },
            { type: 'Branches', id }
         ],
      }),

      // GET /api/branches/manager/:userId - Get branches managed by user
      getBranchesByManager: builder.query({
         query: (userId) => `/manager/${userId}`,
         providesTags: (result) =>
            result?.data
               ? [
                  ...result.data.map(({ branchId }) => ({
                     type: 'ManagerBranches',
                     id: branchId
                  })),
                  { type: 'ManagerBranches', id: 'LIST' }
               ]
               : [{ type: 'ManagerBranches', id: 'LIST' }],
      }),

      // ========== LOCATION & SEARCH OPERATIONS ==========

      // GET /api/branches/nearby - Find nearby branches
      findNearbyBranches: builder.query({
         query: ({ lat, lng, radius = 5 }) => ({
            url: '/nearby',
            params: { lat, lng, radius },
         }),
         providesTags: [{ type: 'Branches', id: 'NEARBY' }],
      }),

      // ========== DASHBOARD & STATISTICS ==========

      // GET /api/branches/:id/dashboard - Get branch dashboard
      getBranchDashboard: builder.query({
         query: (id) => `/${id}/dashboard`,
         providesTags: (result, error, id) => [
            { type: 'BranchDetails', id },
            { type: 'Branches', id }
         ],
      }),

      // POST /api/branches/:id/stats - Update branch statistics
      updateBranchStats: builder.mutation({
         query: ({ id, ...stats }) => ({
            url: `/${id}/stats`,
            method: 'POST',
            body: stats,
         }),
         invalidatesTags: (result, error, { id }) => [
            { type: 'BranchDetails', id },
            { type: 'Branches', id }
         ],
      }),

      // ========== UTILITY ENDPOINTS ==========

      // GET all active branches (lightweight for dropdowns)
      getActiveBranches: builder.query({
         query: (companyId) => ({
            url: `/company/${companyId}`,
            params: {
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
            url: `/company/${companyId}`,
            params: {
               search: branchCode,
               lightweight: true
            },
         }),
         transformResponse: (response) => ({
            isUnique: !response.data?.some(branch =>
               branch.branchCode === branchCode
            )
         }),
      }),
   }),
});

// Export hooks
export const {
   // CRUD Operations
   useCreateBranchMutation,
   useGetCompanyBranchesQuery,
   useGetBranchByIdQuery,
   useUpdateBranchMutation,
   useDeleteBranchMutation,
   useRestoreBranchMutation,

   // Manager Operations
   useAddManagerMutation,
   useRemoveManagerMutation,
   useGetBranchesByManagerQuery,

   // Location & Search
   useFindNearbyBranchesQuery,

   // Dashboard & Stats
   useGetBranchDashboardQuery,
   useUpdateBranchStatsMutation,

   // Utility
   useGetActiveBranchesQuery,
   useValidateBranchCodeQuery,

   // Lazy queries for conditional fetching
   useLazyGetCompanyBranchesQuery,
   useLazyGetBranchByIdQuery,
   useLazyFindNearbyBranchesQuery,
   useLazyGetBranchesByManagerQuery,
   useLazyGetActiveBranchesQuery,
   useLazyValidateBranchCodeQuery,
} = branchesApi;