// authApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice } from "@reduxjs/toolkit";
import { addToast } from "./toastSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 🔹 Token Getter Helper ---
const getToken = (getState) =>
  getState()?.auth?.token ||
  (typeof window !== "undefined" && sessionStorage.getItem("authToken")) ||
  (typeof document !== "undefined" &&
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("authToken="))
      ?.split("=")[1]) ||
  null;

// --- 🔹 Auth Slice ---
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
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
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

// --- 🔹 Auth API ---
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/auth`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getToken(getState);
      headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`); // ✅ send token
      return headers;
    },
    responseHandler: async (response) => {
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        return { ...parsed, status: response.status };
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
    // --- Login ---
    login: builder.mutation({
      query: (loginData) => ({
        url: "/login",
        method: "POST",
        body: loginData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));

        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data.user) {
            sessionStorage.setItem("authToken", data.data.token);
            sessionStorage.setItem("refreshToken", data.data.refreshToken);
            dispatch(setCredentials({ user: data.data.user }));
          }
        } catch (error) {
          dispatch(setError(error.message));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // --- Logout ---
    logout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "DELETE",
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("refreshToken");
            dispatch(clearAuth());
          }
        } catch (error) {
          console.error("[authApi] Logout API error:", error);
        }
      },
    }),

    // --- Get Current User (/me) ---
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

    // --- Other endpoints (register, verify, refresh...) ---
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
          }
        } catch (error) {
          dispatch(setError(error.message));
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
    }),
    // Resend OTP ---
    resendOtp: builder.mutation({
      query: ({ email }) => ({
        url: "/resend-otp",
        method: "POST",
        body: { email },
      }),
      async onQueryStarted({ email }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(addToast({ message: `New OTP sent to ${email}`, type: "success" }));
        } catch (error) {
          const msg = error?.error?.data?.error || "Failed to resend OTP";
          dispatch(addToast({ message: msg, type: "error" }));
          throw error;
        }
      },
    }),

    refreshToken: builder.mutation({
      query: () => ({
        url: "/refresh",
        method: "POST",
      }),
      transformResponse: (res, meta) => {
        if (res.success) {
          return { ...res, status: meta?.response?.status || 200 };
        }
        throw {
          message: res.message || "Token refresh failed",
          status: meta?.response?.status || 400,
        };
      },
      transformErrorResponse: (res, meta) => ({
        ...res,
        status: meta?.response?.status || 400,
      }),
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
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useRegisterUserMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useRefreshTokenMutation,
} = authApi;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
