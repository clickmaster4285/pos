"use client";

import React, { createContext, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { createSelector } from "@reduxjs/toolkit";
import {
  useGetMeQuery,
  useRefreshTokenMutation,
  selectIsAuthenticated,
  selectCurrentUser,
  setCredentials,
  clearAuth,
} from "@/features/authApi";
import { secureAuth } from "@/utils/auth"; // for clearing cookies

// 🔹 Memoized selector for authentication state
const selectAuthState = createSelector(
  [selectIsAuthenticated, selectCurrentUser],
  (isAuthenticated, user) => ({
    isAuthenticated,
    user,
  })
);

export const AuthContext = createContext(undefined);

export default function SecureAuthProvider({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useSelector(selectAuthState);
  
const publicRoutes = [
  "/login",
  "/sign-up",
  "/forgot-password",
  "/verify-email",
  "/public/landing",
];

// 👇 Add "/" to redirect automatically to /public/landing
const isPublicRoute = useCallback(
  (path) => {
    // If empty route, redirect to /public/landing
    if (path === "/") {
      if (typeof window !== "undefined") {
        window.location.replace("/public/landing");
      }
      return true; // treat it as public
    }

    return publicRoutes.some(
      (route) => path === route || path.startsWith(route)
    );
  },
  [publicRoutes]
);

  
  // 🔹 Fetch authenticated user if not already authenticated and not on a public route
  const { data, isLoading, error } = useGetMeQuery(undefined, {
    skip: isAuthenticated || isPublicRoute(pathname),
  });

  const [refreshToken] = useRefreshTokenMutation();
  // 🔹 Restore authentication state from Redux if user already in state
  useEffect(() => {
    if (user) {
      try {
        dispatch(setCredentials({ user }));
      } catch (error) {
        console.error("Invalid stored user data:", error);
      }
    }
  }, [dispatch, user]);

  // 🔹 Logout handler
  const handleLogout = useCallback(
    (message = "Logged out") => {
      console.warn(message);
      dispatch(clearAuth());
      secureAuth.clearAuthState(); // Clears cookies/session
      sessionStorage.setItem("explicitLogout", "true");
      router.push("/login");
    },
    [dispatch, router]
  );
  
  // 🔹 When /me endpoint succeeds, store user in Redux
  useEffect(() => {
    if (data?.success && data.data?.user) {
      dispatch(setCredentials({ user: data.data.user }));
    }
  }, [data, dispatch]);

  // 🔹 Handle session expiration (401)
  useEffect(() => {
    if (error?.status === 401 && !isPublicRoute(pathname)) {
      handleLogout("Session expired");
    }
  }, [error, pathname, handleLogout, isPublicRoute]);

  // 🔹 Redirect authenticated users away from public routes
  useEffect(() => {
    if (isAuthenticated && isPublicRoute(pathname)) {
      const dashboardPath = getDashboardPath(user?.role, user?.subRole);
      router.push(dashboardPath);
    }
  }, [isAuthenticated, pathname, router, user, isPublicRoute]);
  
  // 🔹 Role-based dashboard redirection
  const getDashboardPath = useCallback((role, subRole) => {
    const r = String(role || "").toLowerCase();
    switch (r) {
      case "superadmin":
        return "/superadmin/dashboard";
      case "admin":
      case "staff":
        return `/${r}/dashboard`;
            default:
        return "/public/landing";
    }
  }, []);

  // 🔹 Auth context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    logout: handleLogout,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
