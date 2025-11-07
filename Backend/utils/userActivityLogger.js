// middleware/userActivityLogger.js
import IndexModel from "../models/indexModel.js";

const userActivityLogger = async (req, res, next) => {
  const start = Date.now();

  res.on("finish", async () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const route = originalUrl.split("?")[0];

    // Skip health checks, static files, webhooks
    if (
      route.includes("/health") ||
      route.includes("/Uploads") ||
      route.includes("/strip-webhook") ||
      method === "OPTIONS"
    ) {
      return;
    }

    let userId = "anonymous";
    let role = "guest";

    if (req.user) {
      userId = req.user.userId || req.user.id || "unknown";
      role = req.user.role || "unknown";
    } else if (req.headers.authorization || req.cookies.jwt) {
      // Optional: decode JWT to get user without full auth
      // Or leave as "authenticated" if you don't want to decode here
    }

    const logMessage = `${userId} | ${role} | ${method} ${route} | ${ip} | ${res.statusCode} | ${duration}ms`;

    // Use your custom console.userlog
    console.userlog(logMessage);

    // Optional: Save to DB (for analytics/dashboard)
    try {
      await IndexModel.ActiveLog.create({
        userId,
        role,
        action: `${method} ${route}`,
        method,
        route,
        ip,
        statusCode: res.statusCode,
        responseTime: duration,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("Failed to save activity log to DB:", err.message);
    }
  });

  next();
};

export default userActivityLogger;