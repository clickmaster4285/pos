import { NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { LRUCache } from "lru-cache";

const publicPaths = new Set([
  "/",
  "/login",
  "/sign-up",
  "/forgot-password",
  "/verify-email",
  "/public/landing",
]);

function isPublic(pathname) {
  if (publicPaths.has(pathname)) return true;
  if (pathname === "/verify-email" || pathname.startsWith("/verify-email/"))
    return true;
  if (pathname.startsWith("/")) return true;
  return false;
}

const tokenCache = new LRUCache({ max: 1000, ttl: 60 * 60 * 1000 }); // 1h cache

const JWKS = process.env.JWKS_URI
  ? createRemoteJWKSet(new URL(process.env.JWKS_URI))
  : null;

function clearAuthCookies(response) {
  response.cookies.set("authToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

function isAuthorizedRoute(pathname, role) {
  const roleLower = role?.toLowerCase();
  const roleRoutes = {
    superadmin: "/superadmin",
    admin: "/admin",
    staff: "/staff",
  };
  const expectedPrefix = roleRoutes[roleLower];
  if (!expectedPrefix) return false;
  return pathname.startsWith(expectedPrefix);
}

export async function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("authToken")?.value || null;
  const refreshToken = request.cookies.get("refreshToken")?.value || null;
  const authHeader = request.headers.get("authorization");
  const headerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
  const token = accessToken || headerToken;

  if (!token) {
    const response = NextResponse.redirect(new URL("/login", url));
    return clearAuthCookies(response);
  }

  const cacheKey = `verified_${token}`;
  if (tokenCache.get(cacheKey)) {
    return NextResponse.next();
  }

  const secretStr = process.env.JWT_SECRET;
  if (!secretStr && !JWKS) {
    console.error("[Middleware] JWT_SECRET or JWKS_URI not set");
    const response = NextResponse.redirect(new URL("/login", url));
    return clearAuthCookies(response);
  }

  try {
    const secret = secretStr ? new TextEncoder().encode(secretStr) : JWKS;
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [secretStr ? "HS256" : "RS256"],
    });

    // Check if the route is authorized for the user's role
    if (!isAuthorizedRoute(pathname, payload.role)) {
      console.error(
        `[Middleware] Unauthorized access to ${pathname} by user with role ${payload.role}`
      );
      const response = NextResponse.redirect(new URL("/login", url));
      return clearAuthCookies(response);
    }

    tokenCache.set(cacheKey, true);

    if (headerToken && !accessToken) {
      const res = NextResponse.next();
      setAuthCookies(res, token, refreshToken);
      return res;
    }

    return NextResponse.next();
  } catch (err) {
    console.error(`[Middleware] JWT verification failed: ${err.message}`);
    const response = NextResponse.redirect(new URL("/login", url));
    return clearAuthCookies(response);
  }
}

function setAuthCookies(response, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set("authToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  });

  if (refreshToken) {
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
  ],
};