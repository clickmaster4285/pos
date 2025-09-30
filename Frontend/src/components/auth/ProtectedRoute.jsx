"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "./SecureAuthProvider";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, logout } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      const explicitLogout = sessionStorage.getItem("explicitLogout");
      if (!explicitLogout) {
        logout(); // Trigger logout only if not an explicit logout
      }
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, logout, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Return null while redirecting
  }

  return children;
}