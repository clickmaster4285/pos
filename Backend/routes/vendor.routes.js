import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import {
  checkplan,
  checkPermissionsValidation,
} from '../middleware/authMiddleware.js';
import ErrorResponse from '../utils/errorResponse.js';
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  '/create-vendor',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('manageVendors'),
  checkplan('Vendor'),
  Indexcontroller.Vendor.createVendor
);

router.get(
  '/get-all-vendors',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('manageVendors'),
  Indexcontroller.Vendor.getAllVendors
);

router.get(
  '/get-vendors-by-id/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('manageVendors'),
  Indexcontroller.Vendor.getVendorById
);

router.patch(
  '/update-vendor/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('manageVendors'),
  Indexcontroller.Vendor.updateVendor
);

router.delete(
  '/delete-vendor/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('manageVendors'),
  Indexcontroller.Vendor.deleteVendor
);

router.patch(
  '/status-update-vendor/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('manageVendors'),
  // checkplan("Vendor"),
  Indexcontroller.Vendor.active_inactiveVendor
);

export default router;
