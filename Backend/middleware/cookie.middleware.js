import { serialize } from "cookie";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  // sameSite: "lax",
  sameSite: "none",
  maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) * 24 * 60 * 60 * 1000, // Convert days to milliseconds
};

// Middleware to set a cookie
const setCookie = (req, res, next) => {
  return (name, value, customOptions = {}) => {
    const options = { ...cookieOptions, ...customOptions };
    res.setHeader("Set-Cookie", serialize(name, value, options));
  };
};

// Middleware to get a cookie
const getCookie = (req) => {
  return (name) => {
    const cookies = req.headers.cookie ? parseCookies(req.headers.cookie) : {};
    return cookies[name];
  };
};

// Middleware to clear a cookie
const clearCookie = (res) => {
  return (name) => {
    res.setHeader("Set-Cookie", serialize(name, "", {
      ...cookieOptions,
      maxAge: 0, // Expire immediately
    }));
  };
};

// Helper function to parse cookies
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.split("=").map((c) => c.trim());
    cookies[name] = value;
  });
  return cookies;
};

// Attach cookie utilities to req and res objects
const cookieMiddleware = (req, res, next) => {
  req.getCookie = getCookie(req);
  res.setCookie = setCookie(req, res);
  res.clearCookie = clearCookie(res);
  next();
};

export default cookieMiddleware;