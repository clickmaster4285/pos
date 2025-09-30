// BACKEND/Service/socketService.js - UPDATED
import { Server } from "socket.io";
import passport from "passport";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { getUnreadNotificationsForUser, markDeliveredBatch } from "../utils/notification.service.js";

function extractToken(socket) {
  // 1) From handshake auth
  if (socket.handshake?.auth?.token) {
    return socket.handshake.auth.token;
  }

  // 2) From cookies - prioritize auth_token cookie
  const raw = socket.request?.headers?.cookie;
  if (raw) {
    const parsed = cookie.parse(raw);
    if (parsed.auth_token) return parsed.auth_token;
    if (parsed.authToken) return parsed.authToken;
  }

  // 3) From query params
  const q = socket.handshake?.query?.token;
  if (typeof q === "string" && q) return q;

  // 4) From headers
  const authHeader = socket.request?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

function getUserIdFromJwtPayload(payload) {
  return (
    payload?.id ||
    payload?._id ||
    payload?.sub ||
    payload?.userId ||
    payload?.user?.id ||
    payload?.user?._id ||
    null
  );
}

export function initSocket(server, app, sessionMiddleware) {
  const io = new Server(server, {
    cors: {
      origin: (process.env.FRONTEND_URL || "http://localhost:3000")
        .split(",")
        .map((s) => s.trim()),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 120000,
      skipMiddlewares: false,
    },
    allowEIO3: true,
  });

  // Share session middleware
  io.engine.use((req, res, next) => sessionMiddleware(req, res, next));
  io.engine.use(passport.initialize());
  io.engine.use(passport.session());

  // Enhanced auth middleware with better error handling
  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);

      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          const uid = getUserIdFromJwtPayload(payload);
          if (!uid) throw new Error("No user id in token payload");
          
          socket.user = { 
            id: String(uid), 
            from: "jwt",
            token: token
          };
          return next();
        } catch (jwtError) {
          console.error("JWT verification failed:", jwtError.message);
          // Continue to session fallback
        }
      }

      // Session fallback
      const req = socket.request;
      const sessUser = req?.user || req?.session?.user;
      if (sessUser && (sessUser._id || sessUser.id)) {
        socket.user = { 
          id: String(sessUser._id || sessUser.id), 
          from: "session" 
        };
        return next();
      }

      console.error("Socket auth failed - no valid token or session");
      return next(new Error("Unauthorized"));
    } catch (error) {
      console.error("Socket auth middleware error:", error);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    const connectionType = socket.user.from;
    
    socket.join(userId);
    console.log(`🔌 Socket connected for user ${userId} via ${connectionType}: ${socket.id}`);

    try {
      const missed = await getUnreadNotificationsForUser(userId);
      if (missed?.length) {
        socket.emit("notifications.backfill", missed);
        await markDeliveredBatch(missed.map((n) => n._id));
      }
    } catch (e) {
      console.error("Backfill error:", e);
    }

    socket.on("disconnect", (reason) => {
      console.log(`⚠️ Socket disconnected ${socket.id} (${reason})`);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    // Handle reauthentication if needed
    socket.on("reauthenticate", (newToken) => {
      try {
        const payload = jwt.verify(newToken, process.env.JWT_SECRET);
        const uid = getUserIdFromJwtPayload(payload);
        if (uid === userId) {
          socket.user.token = newToken;
          socket.emit("reauthentication_success");
        } else {
          socket.emit("reauthentication_failed");
        }
      } catch (error) {
        socket.emit("reauthentication_failed");
      }
    });
  });

  app.set("emitNotification", (userId, payload) => {
    io.to(String(userId)).emit("notifications.new", payload);
  });

  app.set("io", io);
  
  console.log("Socket.IO server initialized with connection recovery");
  return io;
}