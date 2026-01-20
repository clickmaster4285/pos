import jwt from "jsonwebtoken";

const getToken = () => {
  if (typeof window === "undefined") return null;

  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1];
  return cookieToken || null;
};

const getRefreshToken = () => {
  if (typeof window === "undefined") return null;

  const refreshToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("refreshToken="))
    ?.split("=")[1];
  return refreshToken || null;
};

class SecureAuth {
  constructor() {
    this.tokenRefreshInterval = null;
  }

  startTokenRefresh(refreshFn) {
    this.stopTokenRefresh();

    this.tokenRefreshInterval = setInterval(async () => {
      try {
        const refreshed = await refreshFn();
        if (refreshed) {
        } else {
          console.warn("[SecureAuth] Token refresh returned false");
          this.handleAutoLogout("Token refresh failed");
        }
      } catch (error) {
        console.error("[SecureAuth] Token refresh failed:", error);
        this.handleAutoLogout("Token refresh error");
      }
    }, 12 * 60 * 60 * 1000); // Every 12 hours
  }

  stopTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  handleAutoLogout(message = "Session expired") {
    this.clearAuthState();
    this.stopTokenRefresh();

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("authTimeout", { detail: message }));
    }
  }

  clearAuthState() {
    if (typeof window === "undefined") return;

    try {
      document.cookie = "authToken=; path=/; max-age=0; secure; samesite=strict";
      document.cookie = "refreshToken=; path=/; max-age=0; secure; samesite=strict";
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.setItem("explicitLogout", "true");
    } catch (error) {
      console.error("[SecureAuth] Error clearing auth state:", error);
    }
  }

  async trySilentRefresh() {
    if (sessionStorage.getItem("explicitLogout") === "true") {
      return false;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.success && data.data.token && data.data.refreshToken) {
        document.cookie = `authToken=${data.data.token}; path=/; max-age=${24 * 60 * 60}; secure=${
          process.env.NODE_ENV === "production"
        }; samesite=strict`;
        document.cookie = `refreshToken=${data.data.refreshToken}; path=/; max-age=${14 * 24 * 60 * 60}; secure=${
          process.env.NODE_ENV === "production"
        }; samesite=strict`;
        sessionStorage.setItem("authToken", data.data.token);
        sessionStorage.setItem("refreshToken", data.data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[SecureAuth] Silent refresh failed:", error);
      return false;
    }
  }
}

export const secureAuth = new SecureAuth();
export { getToken, getRefreshToken };