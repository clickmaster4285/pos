import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import passport from '../middleware/passportAuth.middleware.js';
import { updateSuperAdminInfo } from "../config/superAdminConfig.js";
import { createCompanybySuperAdmin } from "../config/superAdminConfig.js";
import { superAdminDashboard } from "../config/superAdminConfig.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.patch(
  "/update-super-admin-info-by-super-admin",
  passport.authenticate("jwt", { session: false }),
  upload.single("toolLogo"), // Matches Postman field name
  updateSuperAdminInfo
);

router.post(
  "/create-company-by-super-admin",
  passport.authenticate("jwt", { session: false }),
  createCompanybySuperAdmin
);

router.get(
  "/super-admin-dashboard",
  passport.authenticate("jwt", { session: false }),
  superAdminDashboard
);

export default router;
