// controllers/dataManagementController.js
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import archiver from "archiver";
import multer from "multer";
import extract from "extract-zip";

const execAsync = promisify(exec);
const TEMP_DIR = path.join(process.cwd(), "temp-backup");

// Ensure directory exists
const ensureDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [ERROR] Cannot create dir: ${dirPath} - ${err.message}`);
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
        console.error(`[${new Date().toISOString()}] [CLEANUP FAIL] ${p}: ${err.message}`);
      }
    }
  });
};

// Extract ZIP with detailed errors
const extractZip = async (zipPath, extractDir) => {
  try {
    await extract(zipPath, { dir: extractDir });
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ZIP EXTRACT FAIL] ${error.message}`);
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
  if (!fs.existsSync(mongodbDir)) {
    throw new Error("Invalid backup: Missing 'mongodb' folder.");
  }
  if (!fs.existsSync(metadataFile)) {
    throw new Error("Invalid backup: Missing 'metadata.json'.");
  }

  // Read metadata
  let metadata;
  try {
    const metadataContent = fs.readFileSync(metadataFile, 'utf8');
    metadata = JSON.parse(metadataContent);
  } catch (err) {
    throw new Error("Invalid metadata in backup file.");
  }
  
  const dbName = process.env.MONGODB_DB_NAME || "AutoMotive_Industry";
  const dbPath = path.join(mongodbDir, dbName);
  
  if (!fs.existsSync(dbPath)) {
    const available = fs.readdirSync(mongodbDir).join(", ");
    throw new Error(`Backup missing database "${dbName}". Found: ${available || "none"}`);
  }
  
  let collections = [];
  try {
    collections = fs.readdirSync(dbPath)
  .filter(f => f.endsWith(".bson.gz"));

  } catch (err) {
    throw new Error("Could not read database files in backup.");
  }

  if (collections.length === 0) {
    throw new Error("No collections found in backup database.");
  }

  return {
    mongodbCollectionsCount: collections.length,
    uploadsFiles: fs.existsSync(path.join(extractDir, "uploads"))
      ? fs.readdirSync(path.join(extractDir, "uploads")).length
      : 0,
    metadata
  };
};

// ========================== EXPORT ALL DATA ==========================
export const exportAllData = async (req, res) => {
  let tempDir = null;
  try {
    if (req.user?.role !== "superAdmin") {
      return res.status(403).json({ success: false, message: "Only super admins can export data." });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    tempDir = path.join(TEMP_DIR, `export-${timestamp}`);
    ensureDir(tempDir);

    const dbName = process.env.MONGODB_DB_NAME || "AutoMotive_Industry";

    // Run mongodump with timeout
    try {
      await Promise.race([
        execAsync(`mongodump --uri="${process.env.MONGO_URI}" --out "${tempDir}/mongodb" --gzip --db "${dbName}"`),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Export timeout after 5 minutes")), 300000))
      ]);
    } catch (err) {
      if (err.message.includes("timeout")) {
        throw new Error("Export timed out. Database too large or slow.");
      }
      if (err.code === 127) {
        throw new Error("mongodump tool not installed on server.");
      }
      throw new Error(`Failed to export database: ${err.message}`);
    }

    // Copy uploads
    const uploadsSource = path.join(process.cwd(), "Uploads");
    const uploadsDest = path.join(tempDir, "uploads");
    if (fs.existsSync(uploadsSource)) {
      try {
        fs.cpSync(uploadsSource, uploadsDest, { recursive: true });
      } catch (err) {
        console.warn(`[${new Date().toISOString()}] Uploads copy failed: ${err.message}`);
      }
    }

    // Metadata
    const metadata = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email,
      role: req.user.role,
      nodeEnv: process.env.NODE_ENV,
      dbName,
      version: "1.0.0",
      accordingly: req.user.role === "superAdmin" ? "full" : req.user.companyId,
    };

    // Stream ZIP
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="automotive-backup-${timestamp}.zip"`);

    const archive = archiver("zip", { 
      zlib: { level: 6 } 
    });
    
    archive.on("error", (err) => {
      console.error(`[${new Date().toISOString()}] [ARCHIVE ERROR] ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Failed to create ZIP archive." });
      }
    });

    archive.on("warning", (err) => {
      if (err.code === 'ENOENT') {
        console.warn(`[${new Date().toISOString()}] [ARCHIVE WARNING] ${err.message}`);
      } else {
        throw err;
      }
    });

    archive.pipe(res);
    archive.directory(path.join(tempDir, "mongodb"), "mongodb");
    if (fs.existsSync(uploadsDest)) {
      archive.directory(uploadsDest, "uploads");
    }
    archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });
    
    await archive.finalize();

    console.log(`[${new Date().toISOString()}] Export successful: ${req.user.email}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [EXPORT FAIL] ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Export failed due to server error" 
      });
    }
  } finally {
    if (tempDir) {
      setTimeout(() => cleanup([tempDir]), 5000); // Delay cleanup to ensure stream completes
    }
  }
};

// ========================== IMPORT DATA ==========================
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadPath = path.join(TEMP_DIR, `incoming-${Date.now()}`);
      ensureDir(uploadPath);
      req.uploadPath = uploadPath; // Store for cleanup
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    cb(null, `backup-upload-${timestamp}.zip`);
  },
});

const importUpload = multer({
  storage: importStorage,
  fileFilter: (req, file, cb) => {
    console.log("the req.file::::::::: ", file)
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || 
        file.originalname.toLowerCase().endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed."));
    }
  },
  limits: { 
    fileSize: 500 * 1024 * 1024 // 500MB
  },
}).single("backupFile");

export const importData = [
  (req, res, next) => {
    importUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File too large. Maximum size is 500MB." });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    let zipPath = null, extractDir = null;
    try {
      if (req.user?.role !== "superAdmin") {
        return res.status(403).json({ success: false, message: "Only super admins can import data." });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No backup file uploaded." });
      }

      zipPath = req.file.path;
      const fileSize = (req.file.size / (1024 * 1024)).toFixed(2);
      console.log(`[${new Date().toISOString()}] Import started: ${req.file.originalname} (${fileSize}MB) by ${req.user.email}`);

      extractDir = path.join(TEMP_DIR, `extract-${Date.now()}`);
      ensureDir(extractDir);
      
      console.log("teh e zipPath and extractDir j  are: ", extractDir)
      await extractZip(zipPath, extractDir);

      const info = verifyExtracted(extractDir);
      const dbName = process.env.MONGODB_DB_NAME || "AutoMotive_Industry";
      
      // Extract base URI for mongorestore
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error("MongoDB connection URI not configured.");
      }
      
      const mongoDir = path.join(extractDir, "mongodb", dbName);

      if (!fs.existsSync(mongoDir)) {
        const availableDbs = fs.readdirSync(path.join(extractDir, "mongodb"));
        console.log("teh e availableDbs are: ", availableDbs)
        throw new Error(`Backup does not contain data for database "${dbName}". Available databases: ${availableDbs.join(", ") || "none"}`);
      }

      // Use full URI for mongorestore to avoid connection issues
      const restoreCmd = `mongorestore --uri="${mongoUri}" --db "${dbName}" --drop "${mongoDir}" --gzip --quiet`;

      console.log(`[${new Date().toISOString()}] Restoring database: ${restoreCmd}`);

      try {
        const { stdout, stderr } = await Promise.race([
          execAsync(restoreCmd, { 
            timeout: 600000, // 10 minutes timeout
            maxBuffer: 1024 * 1024 * 50 // 50MB buffer for large outputs
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Database restore timeout after 10 minutes")), 600000))
        ]);

        if (stderr && !stderr.includes("done")) {
          console.warn(`[${new Date().toISOString()}] mongorestore warnings: ${stderr}`);
        }
        
        console.log(`[${new Date().toISOString()}] Database restore completed successfully`);
      } catch (execErr) {
        console.error(`[${new Date().toISOString()}] mongorestore failed:`, execErr.message);
        if (execErr.message.includes("timeout")) {
          throw new Error("Import timed out. Database may be too large.");
        }
        if (execErr.code === 127) {
          throw new Error("mongorestore tool not installed on server.");
        }
        if (execErr.message.includes("No such file") || execErr.message.includes("command not found")) {
          throw new Error("mongorestore tool not found. Please install MongoDB database tools.");
        }
        if (execErr.message.includes("Authentication failed")) {
          throw new Error("Database authentication failed. Check connection settings.");
        }
        throw new Error(`Database restore failed: ${execErr.message.split('\n')[0]}`);
      }

      // Replace uploads directory
      const uploadsDir = path.join(process.cwd(), "Uploads");
      const extractedUploads = path.join(extractDir, "uploads");
      
      if (fs.existsSync(extractedUploads)) {
        try {
          // Backup old uploads temporarily
          const oldUploadsBackup = path.join(TEMP_DIR, `uploads-backup-${Date.now()}`);
          if (fs.existsSync(uploadsDir)) {
            fs.cpSync(uploadsDir, oldUploadsBackup, { recursive: true });
          }
          
          // Remove old uploads
          if (fs.existsSync(uploadsDir)) {
            fs.rmSync(uploadsDir, { recursive: true, force: true });
          }
          
          // Copy new uploads
          fs.cpSync(extractedUploads, uploadsDir, { recursive: true });
          console.log(`[${new Date().toISOString()}] Uploads restored: ${info.uploadsFiles} files`);
          
          // Cleanup backup after successful restore
          setTimeout(() => cleanup([oldUploadsBackup]), 10000);
        } catch (uploadErr) {
          console.error(`[${new Date().toISOString()}] Uploads restore failed:`, uploadErr.message);
          throw new Error(`Failed to restore uploads: ${uploadErr.message}`);
        }
      } else {
        console.warn(`[${new Date().toISOString()}] No uploads folder found in backup`);
      }

      res.json({
        success: true,
        message: "Backup restored successfully!",
        details: {
          collections: info.mongodbCollectionsCount,
          uploads: info.uploadsFiles,
          database: dbName,
          importedBy: req.user.email,
          importedAt: new Date().toISOString()
        },
      });

      console.log(`[${new Date().toISOString()}] Import completed successfully by ${req.user.email}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [IMPORT FAILED] ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: error.message || "Import failed due to server error" 
        });
      }
    } finally {
      // Cleanup temporary files
      const pathsToCleanup = [zipPath, extractDir, req.uploadPath].filter(Boolean);
      setTimeout(() => cleanup(pathsToCleanup), 3000);
    }
  },
];

// ========================== BACKUP INFO ==========================
export const getBackupInfo = async (req, res) => {
  try {
    if (req.user?.role !== "superAdmin") {
      return res.status(403).json({ success: false, message: "Access denied. Super admin role required." });
    }

    const uploadsDir = path.join(process.cwd(), "Uploads");
    let sizeMB = "0.00";
    let fileCount = 0;
    let exists = false;

    if (fs.existsSync(uploadsDir)) {
      try {
        const getAllFiles = (dir) => {
          let files = [];
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              files = files.concat(getAllFiles(fullPath));
            } else {
              files.push(fullPath);
            }
          }
          return files;
        };

        const allFiles = getAllFiles(uploadsDir);
        fileCount = allFiles.length;
        const totalSize = allFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
        sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        exists = true;
      } catch (err) {
        console.warn(`[${new Date().toISOString()}] Uploads scan failed: ${err.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        uploads: { 
          exists, 
          fileCount, 
          sizeMB 
        },
        database: {
          name: process.env.MONGODB_DB_NAME || "AutoMotive_Industry",
          connection: process.env.MONGO_URI ? "Connected" : "Not configured"
        },
        server: {
          environment: process.env.NODE_ENV || "development",
          tempDirectory: TEMP_DIR
        }
      },
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [BACKUP INFO FAIL] ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get backup information." 
    });
  }
};

// ========================== CLEANUP TEMP FILES ==========================
export const cleanupTempFiles = async (req, res) => {
  try {
    if (req.user?.role !== "superAdmin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      cleanup([TEMP_DIR]);
      
      res.json({
        success: true,
        message: `Cleaned up ${files.length} temporary files/folders`,
        cleaned: files.length
      });
    } else {
      res.json({
        success: true,
        message: "No temporary files to clean up",
        cleaned: 0
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [CLEANUP FAIL] ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: "Failed to clean up temporary files." 
    });
  }
};