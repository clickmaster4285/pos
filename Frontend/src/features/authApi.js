import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice } from "@reduxjs/toolkit";
import { addToast } from "./toastSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("authUser", JSON.stringify(action.payload.user));
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("authUser");
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, clearAuth, setLoading, setError } =
  authSlice.actions;

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/auth`,
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
    responseHandler: async (response) => {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return {
          status: response.status,
          message: text,
          isHtml: text.startsWith("<!DOCTYPE html>"),
        };
      }
    },
  }),
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (loginData) => ({
        url: "/login",
        method: "POST",
        body: loginData,
      }),
      transformResponse: (res) => {
        if (res.success) {
          return res;
        }
        throw new Error(res.message || "Login failed");
      },
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));

        try {
          const { data } = await queryFulfilled;

          if (data.success && data.data.user) {
            console.log("the data.data are: ", data)
            // ✅ Save tokens in sessionStorage
            sessionStorage.setItem("authToken", data.data.token);
            sessionStorage.setItem("refreshToken", data.data.refreshToken);

            // ✅ Update redux state
            dispatch(setCredentials({ user: data.data.user }));

            // ✅ Show success toast
            dispatch(
              addToast({
                type: "success",
                message: `Welcome back, ${data.data.user.name}!`,
              })
            );
          }
        } catch (error) {
          dispatch(setError(error.message));
          dispatch(
            addToast({
              type: "error",
              message: error.message || "Login failed",
            })
          );
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "DELETE",
        credentials: "include",
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success) {
            sessionStorage.removeItem("authUser");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("refreshToken");
            dispatch(clearAuth());
            dispatch(
              addToast({
                type: "info",
                message: data.message || "Logged out successfully",
              })
            );
          }
        } catch (error) {
          console.error("[authApi] Logout API error:", error);
          dispatch(
            addToast({
              type: "error",
              message: "Logout failed, please try again",
            })
          );
        }
      },
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/refresh",
        method: "POST",
      }),
      transformResponse: (res) => {
        if (res.success) {
          return res;
        }
        throw new Error(res.message || "Token refresh failed");
      },
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data.user) {
            dispatch(setCredentials({ user: data.data.user }));
          }
        } catch (error) {
          console.error("[authApi] Token refresh failed:", error);
          dispatch(clearAuth());
        }
      },
    }),
    getMe: builder.query({
      query: () => "/me",
      providesTags: ["Auth"],
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data.user) {
            dispatch(setCredentials({ user: data.data.user }));
          }
        } catch (error) {
          dispatch(setError("Failed to fetch user data"));
        }
      },
    }),
    registerUser: builder.mutation({
      query: (registerData) => ({
        url: "/register",
        method: "POST",
        body: registerData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));

        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data.user) {
            dispatch(setCredentials({ user: data.data.user }));
            dispatch(
              addToast({
                type: "success",
                message: `Welcome, ${data.data.user.name}!`,
              })
            );
          }
        } catch (error) {
          dispatch(setError(error.message));
          dispatch(
            addToast({
              type: "error",
              message: error.message || "Registration failed",
            })
          );
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    verifyEmail: builder.mutation({
      query: ({ email, otp }) => ({
        url: "/verify-email",
        method: "POST",
        body: { email, otp },
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            addToast({
              type: "success",
              message: data.message || "Email verified successfully",
            })
          );
        } catch (error) {
          dispatch(
            addToast({
              type: "error",
              message: error?.data?.message || "Email verification failed",
            })
          );
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useRegisterUserMutation,
  useVerifyEmailMutation,
} = authApi;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
