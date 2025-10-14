import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import http from "http";
import https from "https";
import fs from "fs";
import { fileURLToPath } from "url";
import createSuperAdmin from "./config/superAdminConfig.js";
import apiRouter from "./routes/indexRouter.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import IndexModel from "./models/indexModel.js";
import ZKDeviceService from "./utils/zkDeviceService.js"; // Added missing import
import bodyParser from "body-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const HOST = process.env.HOST || "localhost";
const PORT = Number(process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || "development";

await connectDB();
await createSuperAdmin();

const allowedOrigins = (process.env.FRONTEND_URL || "https://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.set("trust proxy", true);
app.use(
  "/api/strip/strip-webhook",
  bodyParser.raw({ type: "application/json" })
);
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(morgan(NODE_ENV === "development" ? "dev" : "combined"));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
app.use("/api", apiRouter);

// Automatically start real-time listeners for all devices
const startRealTimeListeners = async () => {
  try {
    // console.log("🔄 Starting real-time attendance listeners for all ZK devices...");
    
    const devices = await IndexModel.AttendanceDevice.find({ 
      deleted: false 
    });

    let successful = 0;
    let failed = 0;

    for (const device of devices) {
      try {
        await ZKDeviceService.listenForRealTimeAttendance(device._id);
        successful++;
        // console.log(`✅ Listening: ${device.deviceName} (${device.deviceIp})`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed: ${device.deviceName} - ${error.message}`);
      }
    }

    // console.log(`📊 Real-time listeners: ${successful} successful, ${failed} failed`);

  } catch (error) {
    // console.error("❌ Failed to start real-time listeners:", error.message);
  }
};


if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public", "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

let server;
const KEY_PATH = process.env.SSL_KEY_PATH;
const CERT_PATH = process.env.SSL_CERT_PATH;

if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
  const options = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
  };
  server = https.createServer(options, app);
  console.log("🔒 HTTPS server enabled");
} else {
  server = http.createServer(app);
  console.log("🔓 HTTP server enabled (certs not found)");
}

const originalWrite = process.stdout.write;
process.stdout.write = function (chunk, encoding, callback) {
  if (typeof chunk === 'string' && chunk.trim() === 'ok tcp') return;
  return originalWrite.apply(process.stdout, arguments);
};

server.listen(PORT, HOST, () => {
  const scheme = fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH) ? "https" : "http";
  console.log(`🚀 Server running at ${scheme}://${HOST}:${PORT} in ${NODE_ENV} mode`);
  startRealTimeListeners();
});

cron.schedule("* * * * *", async () => {
  try {
    const now = Date.now();
    const unverifiedAdmins = await IndexModel.User.find({
      role: "admin",
      verified: false,
      verificationExpiry: { $lt: now },
    });

    for (const admin of unverifiedAdmins) {
      const company = await IndexModel.Company.findOne({ owner: admin.userId });
      if (company) {
        await IndexModel.Company.deleteOne({ _id: company._id });
        console.log(`Deleted unverified company: ${company.companyId}`);
      }
      await IndexModel.User.deleteOne({ _id: admin._id });
      console.log(`Deleted unverified admin: ${admin.userId}`);
    }
  } catch (err) {
    console.error("Cron job error (unverified admins):", err);
  }
});

cron.schedule("* * * * *", async () => {
  try {
    const now = Date.now();
    const companies = await IndexModel.Company.find({ "plan.isActive": true });

    for (const company of companies) {
      let plansUpdated = false;
      const updatedPlans = company.plan.map((plan) => {
        if (plan.isActive) {
          const updatedAt = new Date(plan.updatedAt);
          const daysDiff = Math.floor(
            (now - updatedAt) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff >= plan.validateDays) {
            console.log(
              `Plan ${plan.name} (ID: ${plan._id}) for company ${company.companyId} has expired.`
            );
            plansUpdated = true;
            return { ...plan, isActive: false };
          }
        }
        return plan;
      });

      if (plansUpdated) {
        await IndexModel.Company.updateOne(
          { _id: company._id },
          { $set: { plan: updatedPlans } }
        );
        console.log(`Updated plans for company: ${company.companyId}`);
      }
    }
  } catch (err) {
    console.error("Cron job error (plan validation):", err);
  }
});

cron.schedule("* * * * *", async () => {
  try {
    const now = Date.now();
    const unverifiedUsers = await IndexModel.User.find({
      verified: false,
      role: "user",
      verificationExpiry: { $lte: now },
    });

    for (const user of unverifiedUsers) {
      await IndexModel.User.deleteOne({ _id: user._id });
      console.log(`Deleted unverified user: ${user.userId}`);
    }
  } catch (err) {
    console.error("Cron job error (delete unverified users):", err);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    const expiredTokens = await RefreshToken.deleteMany({
      expiresAt: { $lte: new Date() },
    });
    console.log(`Deleted ${expiredTokens.deletedCount} expired refresh tokens`);
  } catch (err) {
    console.error("Cron job error (delete expired refresh tokens):", err);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    if (sessionStore) {
      await new Promise((resolve, reject) => {
        sessionStore.clear((err) => {
          if (err) {
            console.error("Error clearing expired sessions:", err);
            reject(err);
          } else {
            console.log("Cleared expired sessions");
            resolve();
          }
        });
      });
    }
  } catch (err) {
    console.error("Cron job error (clear sessions):", err);
  }
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully");
  server.close(() => process.exit(0));
});