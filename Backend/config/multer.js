// config/multer.js
import multer from "multer";
import path from "path";
import fs from "fs";

const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === "toolLogo") {
      uploadPath = path.join(process.cwd(), "Uploads", "tool");
    } else if (file.fieldname === "companyLogo") {
      uploadPath = path.join(process.cwd(), "Uploads", "company");
    } else if (file.fieldname === "staff") {
      uploadPath = path.join(process.cwd(), "Uploads", "staff");
    } else if (file.fieldname === "productImage") { // Add product image handling
      uploadPath = path.join(process.cwd(), "Uploads", "products");
    } else {
      uploadPath = path.join(process.cwd(), "Uploads", "misc");
    }
    
    createUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let fileName;
    
    if (file.fieldname === "productImage") {
      fileName = `product-${uniqueSuffix}${path.extname(file.originalname)}`;
    } else if (file.fieldname === "toolLogo") {
      fileName = `toolLogo-${uniqueSuffix}${path.extname(file.originalname)}`;
    } else {
      fileName = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
    }
    
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, PNG, GIF, WebP) are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field or too many files.",
      });
    }
  }

  if (error.message.includes("Only images")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};