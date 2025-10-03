import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import { checkplan } from '../middleware/authMiddleware.js';
import ErrorResponse from '../utils/errorResponse.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.post(
  '/create-company',
  // passport.authenticate("jwt", { session: false }),
  Indexcontroller.Company.createCompany
);
router.get(
  '/get-all-company',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Company.getAllCompany
);

router.get(
  '/get-company',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  // checkplan("inventory"),
  Indexcontroller.Company.getCompany
);

router.put(
  '/verify-company_admin',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Company.verifyCompany_Admin
);
router.patch(
  '/status-update-company/:id',
  passport.authenticate('jwt', { session: false }),
  Indexcontroller.Company.active_inactiveCompany
);

router.put(
  '/update-company-settings',
  passport.authenticate('jwt', { session: false }),
  upload.single('companyLogo'),
  Indexcontroller.Company.updateCompanySettings
);
export default router;
