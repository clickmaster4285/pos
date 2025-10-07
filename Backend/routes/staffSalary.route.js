import express from 'express';
import passport from '../middleware/passportAuth.middleware.js';
import Indexcontroller from '../controllers/indexController.js';
import {
  checkplan,
  checkPlanIsActive,
  checkPermissionsValidation,
} from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-payment',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  //   checkPlanIsActive,
  //   checkplan('staffCreate'),
  Indexcontroller.StaffSalary.processPayment
);

router.get(
  '/all-staff-salaries',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  //   checkPlanIsActive,
  //   checkplan('staffCreate'),
  Indexcontroller.StaffSalary.listPayments
);

router.patch(
  '/update-base-salary/:staffId',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.StaffSalary.updateStaffBaseSalary
);

router.delete(
  '/delete-payment/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.StaffSalary.softDeletePayment
);

router.get(
  '/staff-summary/:staffId',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.StaffSalary.getStaffSalarySummary
);
export default router;
