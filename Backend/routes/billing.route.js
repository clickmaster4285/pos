// src/routes/billing.route.js
import express from 'express';
import IndexController from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import { authenticateToken, checkPermissionsValidation, checkPlanIsActive } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-bill',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('addBilling'),
  IndexController.Bill.createBill
);

router.get(
  '/get-all-bills',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewBilling'),
  IndexController.Bill.getBills
);

router.get(
  '/get-bill/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewBilling'),
  IndexController.Bill.getBillById
);

router.patch(
  '/update-bills-status/:billId',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('editBilling'),
  IndexController.Bill.updateItemStatus
);

router.delete(
  '/delete-bill/:billId',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('deleteBilling'),
  IndexController.Bill.deleteBill
);


export default router;