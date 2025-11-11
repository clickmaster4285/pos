// controllers/dataManagementController.js
import path from 'path';
import fs from 'fs';
import os from 'os';
import archiver from 'archiver';
import { exec } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import { upload, handleMulterError } from '../config/multer.js';
import extract from 'extract-zip';

const execAsync = promisify(exec);
const TEMP_DIR = path.join(os.tmpdir(), 'automotive-temp-' + process.pid); // Unique per process

// Ensure temp dir
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Cleanup helper
const cleanup = (paths) => {
  paths.forEach(p => {
    if (p && fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
    }
  });
};

// Cross-platform ZIP extraction
const extractZip = async (zipPath, extractDir) => {
  try {
    await extract(zipPath, { dir: extractDir });
    console.log('ZIP extraction completed using extract-zip');
    return true;
  } catch (extractError) {
    console.error('extract-zip failed:', extractError.message);
    // Fallback to system commands
    try {
      await execAsync(`7z x "${zipPath}" -o"${extractDir}" -y`);
      console.log('ZIP extraction completed using 7z');
      return true;
    } catch (sevenZipError) {
      console.error('7z failed:', sevenZipError.message);
      try {
        await execAsync(`unzip -o "${zipPath}" -d "${extractDir}"`);
        console.log('ZIP extraction completed using unzip');
        return true;
      } catch (unzipError) {
        console.error('unzip failed:', unzipError.message);
        throw new Error('Failed to extract ZIP. Ensure 7-Zip (Windows) or unzip (Linux/Mac) is installed.');
      }
    }
  }
};

// Verify extracted contents
const verifyExtracted = (extractDir) => {
  const contents = {
    mongodb: fs.existsSync(path.join(extractDir, 'mongodb')),
    uploads: fs.existsSync(path.join(extractDir, 'uploads')),
    metadata: fs.existsSync(path.join(extractDir, 'metadata.json')),
    mongodbCollectionsCount: 0,
    uploadsFiles: 0,
  };

  if (contents.mongodb) {
    const mongoDir = path.join(extractDir, 'mongodb');
    const databases = fs.readdirSync(mongoDir);
    for (const db of databases) {
      const dbPath = path.join(mongoDir, db);
      if (fs.statSync(dbPath).isDirectory()) {
        const collections = fs.readdirSync(dbPath).filter(file => file.endsWith('.bson.gz'));
        contents.mongodbCollectionsCount += collections.length;
      }
    }
  }

  if (contents.uploads) {
    const countFiles = (dir) => {
      let count = 0;
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          count += countFiles(fullPath);
        } else {
          count++;
        }
      });
      return count;
    };
    contents.uploadsFiles = countFiles(path.join(extractDir, 'uploads'));
  }

  if (!contents.mongodb || contents.mongodbCollectionsCount === 0) {
    throw new Error('Invalid backup: Missing or empty MongoDB data');
  }

  return contents;
};

export const exportAllData = async (req, res) => {
  let tempExtractDir;
  try {
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({ success: false, message: 'Only super admins can export data' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `backup-${timestamp}.zip`;
    tempExtractDir = path.join(TEMP_DIR, `export-${timestamp}`);
    ensureDir(tempExtractDir);

    // Export MongoDB
    console.log('Exporting MongoDB...');
    const dbName = process.env.MONGODB_DB_NAME || 'automotive';
    await execAsync(`mongodump --uri="${process.env.MONGO_URI}" --out "${tempExtractDir}/mongodb" --gzip`);

    // Copy Uploads
    console.log('Copying Uploads...');
    const uploadsSource = path.join(process.cwd(), 'Uploads');
    const uploadsDest = path.join(tempExtractDir, 'uploads');
    if (fs.existsSync(uploadsSource)) {
      fs.cpSync(uploadsSource, uploadsDest, { recursive: true });
    } else {
      ensureDir(uploadsDest);
    }

    // Metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development',
      exportBy: req.user.email || req.user._id,
      version: '1.0',
    };

    // Stream ZIP to response
    console.log('Streaming ZIP...');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    archive.directory(`${tempExtractDir}/mongodb`, 'mongodb');
    archive.directory(uploadsDest, 'uploads');
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    archive.on('error', (err) => {
      throw err;
    });

    archive.finalize();

    archive.on('end', () => {
      cleanup([tempExtractDir]);
      console.log('Export completed and temp cleaned');
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Export failed: ' + error.message });
  } finally {
    if (tempExtractDir) cleanup([tempExtractDir]);
  }
};

// Multer for import (using system's temp)
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(os.tmpdir(), `automotive-imports-${Date.now()}`);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `backup-${Date.now()}.zip`);
  },
});

const importUpload = multer({
  storage: importStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('application/zip') || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files allowed'), false);
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 },
});

export const importData = [
  importUpload.single('backupFile'),
  async (req, res) => {
    let zipPath = req.file ? req.file.path : null;
    let extractDir;
    try {
      if (req.user.role !== 'superAdmin') {
        throw new Error('Only super admins can import data');
      }

      if (!zipPath) {
        throw new Error('No backup file provided');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      extractDir = path.join(TEMP_DIR, `import-${timestamp}`);
      ensureDir(extractDir);

      // Extract and verify
      await extractZip(zipPath, extractDir);
      const contents = verifyExtracted(extractDir);

      // Restore MongoDB (drop existing)
      console.log('Restoring MongoDB...');
      const dbName = process.env.MONGODB_DB_NAME || 'automotive';
      const mongoUriWithoutDb = process.env.MONGO_URI.replace(/\/[^/]*$/, '');
      const mongoDir = path.join(extractDir, 'mongodb', dbName);
      await execAsync(`mongorestore --uri="${mongoUriWithoutDb}" --db "${dbName}" --drop "${mongoDir}" --gzip`);

      // Replace Uploads
      console.log('Replacing Uploads...');
      const uploadsDest = path.join(process.cwd(), 'Uploads');
      if (fs.existsSync(uploadsDest)) {
        fs.rmSync(uploadsDest, { recursive: true, force: true });
      }
      const extractedUploads = path.join(extractDir, 'uploads');
      if (fs.existsSync(extractedUploads)) {
        fs.cpSync(extractedUploads, uploadsDest, { recursive: true });
      } else {
        ensureDir(uploadsDest);
      }

      res.status(200).json({
        success: true,
        message: 'Import successful',
        importedCollections: contents.mongodbCollectionsCount,
        importedFiles: contents.uploadsFiles,
      });

    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ success: false, message: 'Import failed: ' + error.message });
    } finally {
      cleanup([zipPath, extractDir]);
    }
  }
];

export const getBackupInfo = async (req, res) => {
  try {
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({ success: false, message: 'Only super admins can view backup info' });
    }

    const uploadsInfo = {
      path: path.join(process.cwd(), 'Uploads'),
      exists: fs.existsSync(path.join(process.cwd(), 'Uploads')),
      size: 0,
      sizeFormatted: '0 MB',
    };

    if (uploadsInfo.exists) {
      const getDirSize = (dirPath) => {
        let size = 0;
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) size += stats.size;
          else if (stats.isDirectory()) size += getDirSize(filePath);
        });
        return size;
      };
      uploadsInfo.size = getDirSize(uploadsInfo.path);
      uploadsInfo.sizeFormatted = (uploadsInfo.size / (1024 * 1024)).toFixed(2) + ' MB';
    }

    res.status(200).json({
      success: true,
      data: {
        uploadsInfo,
        databaseName: process.env.MONGODB_DB_NAME || 'Unknown',
      },
    });

  } catch (error) {
    console.error('Backup info error:', error);
    res.status(500).json({ success: false, message: 'Failed to get info: ' + error.message });
  }
};