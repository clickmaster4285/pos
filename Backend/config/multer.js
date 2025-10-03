// multer-config.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Define storage for different types of uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    console.log('Uploading file for field:', file);
    if (file.fieldname === 'companyLogo') {
      uploadPath = path.join(process.cwd(), 'uploads', 'company');
    } else if (file.fieldname === 'staff') {
      uploadPath = path.join(process.cwd(), 'uploads', 'staff');
    } else {
      uploadPath = path.join(process.cwd(), 'uploads', 'misc');
    }
    createUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'), false);
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});
