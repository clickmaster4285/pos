import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import ErrorResponse from '../utils/errorResponse.js';
import { checkOrderValidation } from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermissionsValidation } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post(
  '/create-bill',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('addBilling'),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Bill.createBill
);
router.get(
  '/get-all-bills',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Bill.getBills
);

router.patch(
  '/update-bills-status/:billId',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('editBilling'),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Bill.updateItemStatus
);

router.delete(
  '/delete-bill/:billId',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('deleteBilling'),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Bill.deleteBill
);
export default router;
