import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import { checkplan } from '../middleware/authMiddleware.js';
import ErrorResponse from '../utils/errorResponse.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';
import {fetchToolLogoName} from "../utils/fetchToolLogoName.js";

const router = express.Router();

router.get('/get-tool-name-logo', async (req, res) => {
  try {
    const data = await fetchToolLogoName(); // call your controller function
    res.json(data); // send it as response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  '/create-company',
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
  // checkplan("product"),
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

router.post(
  '/company-email-change',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Company.initiateCompanyEmailChange
);

router.post(
  '/verify-company-email',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Company.verifyCompanyEmailChange
);

router.put(
  '/try-free-plan',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Company.tryFreePlan
);
export default router;
