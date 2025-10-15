"use client";
import { createContext, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { createSelector } from "@reduxjs/toolkit";
import { useGetMeQuery, useRefreshTokenMutation } from "@/features/authApi";
import { selectIsAuthenticated, selectCurrentUser, setCredentials, clearAuth } from "@/features/authApi";
import { secureAuth } from "@/utils/auth"; // Import secureAuth for clearing cookies

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
    "/register",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/public/landing",
  ];
  const isPublicRoute = (path) => {
    return publicRoutes.some((route) => path === route || path.startsWith(route));
  };
  const { data, isLoading, error } = useGetMeQuery(undefined, { skip: isAuthenticated || isPublicRoute(pathname) });
  const [refreshToken] = useRefreshTokenMutation();

  useEffect(() => {
    const restoreAuth = () => {
      const storedUser = sessionStorage.getItem("authUser");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          dispatch(setCredentials({ user: userData }));
        } catch (error) {
          console.error("Invalid stored user data:", error);
          sessionStorage.removeItem("authUser");
        }
      }
    };

    restoreAuth();
  }, [dispatch]);

  const handleLogout = useCallback(
    (message = "Logged out") => {
      dispatch(clearAuth());
      secureAuth.clearAuthState(); // Clear cookies using SecureAuth
      sessionStorage.setItem("explicitLogout", "true");
      router.push("/login");
    },
    [dispatch, router]
  );

  useEffect(() => {
    if (data?.success && data.data.user) {
      dispatch(setCredentials({ user: data.data.user }));
      sessionStorage.setItem("authUser", JSON.stringify(data.data.user));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (error?.status === 401 && !isPublicRoute(pathname)) {
      handleLogout("Session expired");
    }
  }, [error, pathname, handleLogout]);

  useEffect(() => {
    if (isAuthenticated && isPublicRoute(pathname)) {
      // console.log("the user are siginging: ", user)
      const dashboardPath = getDashboardPath(user?.role, user?.subRole);
      router.push(dashboardPath);
    }
  }, [isAuthenticated, pathname, router, user]);

  const getDashboardPath = (role, subrole) => {
    const r = String(role || "").toLowerCase();
    console.log("Determining dashboard path for role:", subrole);
    switch (r) {
      case "superadmin":
        return "/superadmin/dashboard";
      case "admin":
        return "/admin/dashboard";
      case "staff":
        return `/staff/${subrole}/dashboard`;
      case "user":
        return "/user/dashboard";
      default:
        return "/login"; // Changed from /unauthorized to /login
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    logout: handleLogout,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}