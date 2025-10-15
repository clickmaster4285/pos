import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getToken = (getState) => {
  // 1. Try Redux state
  const tokenFromState = getState()?.auth?.token;
  if (tokenFromState) return tokenFromState;

  // 2. Try sessionStorage (browser session)
  if (typeof window !== 'undefined') {
    const tokenFromSession = sessionStorage.getItem('authToken');
    if (tokenFromSession) return tokenFromSession;
  }

  // 3. Try cookies
  if (typeof document !== 'undefined') {
    const tokenFromCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('authToken='))
      ?.split('=')[1];
    if (tokenFromCookie) return tokenFromCookie;
  }

  return null; // No token found
};

export const planApi = createApi({
  reducerPath: 'planApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/plan`,
    credentials: 'include', // default for protected endpoints
    prepareHeaders: (headers, { getState, endpoint }) => {
      // Skip Authorization header for getAllPlans since it's public
      if (endpoint !== 'getAllPlans') {
        const token = getToken(getState);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Plans'],
  endpoints: (builder) => ({
    // ✅ Public endpoint
    getAllPlans: builder.query({
      query: () => ({
        url: '/get-all-plans',
        credentials: 'omit', // 👈 no cookies / no session
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'Plans', id: p._id || p.id })),
              { type: 'Plans', id: 'LIST' },
            ]
          : [{ type: 'Plans', id: 'LIST' }],
    }),

    // 🔒 Protected endpoints
    createPlan: builder.mutation({
      query: (body) => ({
        url: '/create-plan',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Plans', id: 'LIST' }],
    }),

    updatePlan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/update-plan/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: 'Plans', id },
        { type: 'Plans', id: 'LIST' },
      ],
    }),

    deletePlan: builder.mutation({
      query: (id) => ({
        url: `/delete-plan/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (r, e, id) => [
        { type: 'Plans', id },
        { type: 'Plans', id: 'LIST' },
      ],
    }),

    changePlan: builder.mutation({
      query: (body) => ({
        url: `/change-your-plan`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (r, e, { changingPlanId }) => [
        { type: 'Plans', id: changingPlanId },
        { type: 'Plans', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAllPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useChangePlanMutation,
} = planApi;
