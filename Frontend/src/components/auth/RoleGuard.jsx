"use client";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "./SecureAuthProvider";

export function RoleGuard({ 
  children, 
  allowedRoles = [], 
  fallbackPath = '/login' // Changed from /unauthorized to /login
}) {
  const { user, isAuthenticated, isLoading, logout } = useContext(AuthContext);
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    logout(); // Trigger logout instead of redirect
    router.push('/login');
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    logout(); // Trigger logout for unauthorized role
    router.push(fallbackPath);
    return null;
  }

  return children;
}