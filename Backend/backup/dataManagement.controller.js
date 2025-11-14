// controllers/dataManagementController.js
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import archiver from "archiver";
import multer from "multer";
import extract from "extract-zip";
import { MongoClient } from "mongodb";

const execAsync = promisify(exec);
const TEMP_DIR = path.join(process.cwd(), "temp-backup");

// Ensure directory exists
const ensureDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [ERROR] Cannot create dir: ${dirPath} - ${
        err.message
      }`
    );
    throw new Error("Server storage error. Contact support.");
  }
};

// Safe cleanup
const cleanup = (paths) => {
  if (!paths || !Array.isArray(paths)) return;
  paths.forEach((p) => {
    if (p && fs.existsSync(p)) {
      try {
        fs.rmSync(p, { recursive: true, force: true });
      } catch (err) {
        console.error(
          `[${new Date().toISOString()}] [CLEANUP FAIL] ${p}: ${err.message}`
        );
      }
    }
  });
};

// === DYNAMIC: Get ALL collections that have data for this company ===
const getCompanyCollections = async (companyId) => {
  const client = new MongoClient(process.env.MONGO_URI);
  const collections = [];

  try {
    await client.connect();
    const db = client.db();
    const allCollections = await db.listCollections().toArray();

    for (const col of allCollections) {
      const name = col.name;
      try {
        const count = await db.collection(name).countDocuments({ companyId });
        if (count > 0) collections.push(name);
      } catch (err) {
        console.warn(`Could not scan collection ${name}: ${err.message}`);
      }
    }
  } finally {
    await client.close();
  }

  return collections;
};

// Extract ZIP
const extractZip = async (zipPath, extractDir) => {
  try {
    await extract(zipPath, { dir: extractDir });
    return true;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [ZIP EXTRACT FAIL] ${error.message}`
    );
    if (error.message.includes("end of central directory")) {
      throw new Error("ZIP file is corrupted or incomplete.");
    }
    if (error.code === "ENOENT") {
      throw new Error("Backup file missing. Try uploading again.");
    }
    throw new Error("Failed to extract ZIP. Use a valid backup file.");
  }
};

// Validate extracted backup
const verifyExtracted = (extractDir) => {
  const mongodbDir = path.join(extractDir, "mongodb");
  const metadataFile = path.join(extractDir, "metadata.json");

  if (!fs.existsSync(mongodbDir))
    throw new Error("Invalid backup: Missing 'mongodb' folder.");
  if (!fs.existsSync(metadataFile))
    throw new Error("Invalid backup: Missing 'metadata.json'.");

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
  } catch (err) {
    throw new Error("Invalid metadata in backup file.");
  }

  const dbName = process.env.MONGODB_DB_NAME || "AutoMotive_Industry";
  const dbPath = path.join(mongodbDir, dbName);
  if (!fs.existsSync(dbPath)) {
    const available = fs.readdirSync(mongodbDir).join(", ");
    throw new Error(
      `Backup missing database "${dbName}". Found: ${available || "none"}`
    );
  }

  const collections = fs
    .readdirSync(dbPath)
    .filter((f) => f.endsWith(".bson.gz"));
  if (collections.length === 0)
    throw new Error("No collections found in backup database.");

  return {
    mongodbCollectionsCount: collections.length,
    metadata,
  };
};

// ========================== EXPORT ALL DATA (SUPERADMIN ONLY) ==========================
export const exportAllData = async (req, res) => {
  let tempDir = null;
  try {
    if (req.user?.role !== "superAdmin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only super admins can export full data.",
        });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    tempDir = path.join(TEMP_DIR, `export-${timestamp}`);
    ensureDir(tempDir);

    const dbName = process.env.MONGODB_DB_NAME || "AutoMotive_Industry";

    // Full DB dump (preserves ObjectId)
    await Promise.race([
      execAsync(
        `mongodump --uri="${process.env.MONGO_URI}" --out "${tempDir}/mongodb" --gzip`
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 300000)
      ),
    ]).catch((err) => {
      if (err.message.includes("timeout")) throw new Error("Export timed out.");
      if (err.code === 127) throw new Error("mongodump not installed.");
      throw err;
    });

    // Metadata
    const metadata = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email,
      role: "superAdmin",
      nodeEnv: process.env.NODE_ENV,
      dbName,
      version: "1.0.0",
      type: "full",
    };

    // Stream ZIP
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="full-backup-${timestamp}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => {
      if (!res.headersSent)
        res.status(500).json({ success: false, message: "ZIP error." });
    });
    archive.pipe(res);
    archive.directory(path.join(tempDir, "mongodb"), "mongodb");
    archive.append(JSON.stringify(metadata, null, 2), {
      name: "metadata.json",
    });
    await archive.finalize();

    console.log(
      `[${new Date().toISOString()}] Full export by ${req.user.email}`
    );
  } catch (error) {
    console.error(`[EXPORT FAIL] ${error.message}`);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: error.message });
  } finally {
    if (tempDir) setTimeout(() => cleanup([tempDir]), 5000);
  }
};

// ========================== EXPORT COMPANY DATA (ADMIN OR SUPERADMIN) ==========================
export const exportCompanyData = async (req, res) => {
  let tempDir = null;
  try {
    console.log("the companyId exportCompanyData: ", req.query);
    const { companyId } = req.query;
    console.log("the companyId exportCompanyData: ", companyId);
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    if (userRole !== "superAdmin" && userRole !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }
    if (userRole === "admin" && userCompanyId !== companyId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only export your own company.",
        });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    tempDir = path.join(TEMP_DIR, `company-${companyId}-${timestamp}`);
    ensureDir(tempDir);

    const dbName = process.env.MONGODB_DB_NAME || "AutoMotive_Industry";
    const collections = await getCompanyCollections(companyId); // ALL collections with companyId

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="company-${companyId}-backup-${timestamp}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => {
      if (!res.headersSent)
        res.status(500).json({ success: false, message: "ZIP error." });
    });
    archive.pipe(res);

    // Export each collection
    for (const coll of collections) {
      const tempFile = path.join(tempDir, `${coll}.bson.gz`);

      // Proper Windows-safe JSON query
      const query = `"{\\"companyId\\": \\"${companyId}\\"}"`;

      await execAsync(
        `mongodump --uri="${process.env.MONGO_URI}" --collection="${coll}" --query=${query} --archive="${tempFile}" --gzip`
      );

      archive.file(tempFile, { name: `mongodb/${dbName}/${coll}.bson.gz` });
    }

    // Metadata
    const metadata = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email,
      role: userRole,
      companyId,
      nodeEnv: process.env.NODE_ENV,
      dbName,
      version: "1.0.0",
      type: "company",
      collections,
      fileCount: 0, // No uploads
    };
    archive.append(JSON.stringify(metadata, null, 2), {
      name: "metadata.json",
    });
    await archive.finalize();

    console.log(
      `Company export: ${companyId}, Collections: ${collections.length}`
    );
  } catch (error) {
    console.error(`[COMPANY EXPORT FAIL] ${error.message}`);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: error.message });
  } finally {
    if (tempDir) setTimeout(() => cleanup([tempDir]), 5000);
  }
};

// ========================== IMPORT FULL DATA (SUPERADMIN ONLY) ==========================
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(TEMP_DIR, `incoming-${Date.now()}`);
    ensureDir(uploadPath);
    req.uploadPath = uploadPath;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    cb(null, `backup-${timestamp}.zip`);
  },
});

const importUpload = multer({
  storage: importStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes("zip") || file.originalname.endsWith(".zip"))
      cb(null, true);
    else cb(new Error("Only ZIP files allowed."));
  },
  limits: { fileSize: 500 * 1024 * 1024 },
}).single("backupFile");

export const importData = [
  (req, res, next) => {
    importUpload(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ success: false, message: "File too large. Max 500MB." });
      }
      if (err)
        return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  async (req, res) => {
    let zipPath = null,
      extractDir = null;
    try {
      if (req.user?.role !== "superAdmin") {
        return res
          .status(403)
          .json({
            success: false,
            message: "Only super admins can import full data.",
          });
      }
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });

      zipPath = req.file.path;
      extractDir = path.join(TEMP_DIR, `extract-${Date.now()}`);
      ensureDir(extractDir);
      await extractZip(zipPath, extractDir);

      const info = verifyExtracted(extractDir);
      console.log("the info: ", info)
      if (info.metadata.type !== "full")
        throw new Error("This is not a full backup.");

      const dbName = process.env.MONGODB_DB_NAME || "AutoMotive_Industry";
      const mongoDir = path.join(extractDir, "mongodb", dbName);

      await execAsync(
        `mongorestore --uri="${process.env.MONGO_URI}" --drop "${mongoDir}" --gzip --quiet`,
        {
          timeout: 600000,
          maxBuffer: 50 * 1024 * 1024,
        }
      );

      res.json({
        success: true,
        message: "Full backup restored successfully!",
        details: {
          collections: info.mongodbCollectionsCount,
          importedBy: req.user.email,
        },
      });
    } catch (error) {
      console.error(`[IMPORT FAILED] ${error.message}`);
      if (!res.headersSent)
        res.status(500).json({ success: false, message: error.message });
    } finally {
      setTimeout(
        () => cleanup([zipPath, extractDir, req.uploadPath].filter(Boolean)),
        3000
      );
    }
  },
];

// ========================== IMPORT COMPANY DATA ==========================
const importCompanyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(TEMP_DIR, `company-in-${Date.now()}`);
    ensureDir(uploadPath);
    req.uploadPath = uploadPath;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    cb(null, `company-backup-${timestamp}.zip`);
  },
});

const importCompanyUpload = multer({
  storage: importCompanyStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes("zip") || file.originalname.endsWith(".zip"))
      cb(null, true);
    else cb(new Error("Only ZIP files allowed."));
  },
  limits: { fileSize: 500 * 1024 * 1024 },
}).single("backupFile");

export const importCompanyData = [
  (req, res, next) => {
    importCompanyUpload(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ success: false, message: "File too large." });
      }
      if (err)
        return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  async (req, res) => {
    let zipPath = null,
      extractDir = null;
    try {
      const { companyId } = req.params;
      const userRole = req.user.role;
      const userCompanyId = req.user.companyId;

      if (userRole !== "superAdmin" && userRole !== "admin") {
        return res
          .status(403)
          .json({ success: false, message: "Access denied." });
      }
      if (userRole === "admin" && userCompanyId !== companyId) {
        return res
          .status(403)
          .json({
            success: false,
            message: "You can only restore your own company.",
          });
      }
      if (!req.file)
        return res.status(400).json({ success: false, message: "No file." });

      zipPath = req.file.path;
      extractDir = path.join(TEMP_DIR, `company-extract-${Date.now()}`);
      ensureDir(extractDir);
      await extractZip(zipPath, extractDir);

      const metadataFile = path.join(extractDir, "metadata.json");
      if (!fs.existsSync(metadataFile))
        throw new Error("Missing metadata.json");
      const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
      if (metadata.type !== "company") throw new Error("Not a company backup.");
      if (userRole === "admin" && metadata.companyId !== userCompanyId) {
        throw new Error("Company mismatch.");
      }

      const dbName = process.env.MONGODB_DB_NAME || "AutoMotive_Industry";
      const mongoDir = path.join(extractDir, "mongodb", dbName);
      let restored = 0;

      if (fs.existsSync(mongoDir)) {
        const files = fs
          .readdirSync(mongoDir)
          .filter((f) => f.endsWith(".bson.gz"));
        for (const file of files) {
          const coll = file.replace(".bson.gz", "");
          const filePath = path.join(mongoDir, file);
          await execAsync(
  `mongorestore --uri="${process.env.MONGO_URI}" --archive="${filePath}" --gzip --quiet`
);
          restored++;
        }
      }

      res.json({
        success: true,
        message: "Company restored!",
        details: {
          companyId,
          collectionsRestored: restored,
          importedBy: req.user.email,
        },
      });
    } catch (error) {
      console.error(`[COMPANY IMPORT FAILED] ${error.message}`);
      if (!res.headersSent)
        res.status(500).json({ success: false, message: error.message });
    } finally {
      setTimeout(
        () => cleanup([zipPath, extractDir, req.uploadPath].filter(Boolean)),
        3000
      );
    }
  },
];

// ========================== INFO & CLEANUP ==========================
export const getBackupInfo = async (req, res) => {
  if (req.user?.role !== "superAdmin")
    return res.status(403).json({ success: false, message: "Access denied." });

  res.json({
    success: true,
    data: {
      database: {
        name: process.env.MONGODB_DB_NAME || "AutoMotive_Industry",
        connection: process.env.MONGO_URI ? "Connected" : "Not configured",
      },
      server: { environment: process.env.NODE_ENV || "development" },
    },
  });
};

export const cleanupTempFiles = async (req, res) => {
  if (req.user?.role !== "superAdmin")
    return res.status(403).json({ success: false, message: "Access denied." });

  const files = fs.existsSync(TEMP_DIR) ? fs.readdirSync(TEMP_DIR) : [];
  cleanup([TEMP_DIR]);
  res.json({
    success: true,
    message: `Cleaned ${files.length} items`,
    cleaned: files.length,
  });
};
