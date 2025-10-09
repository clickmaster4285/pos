import express from 'express';
import passport from '../middleware/passportAuth.middleware.js';
import Indexcontroller from '../controllers/indexController.js';
import { checkPermissionsValidation } from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-payment',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('createPayment'),
  authenticateToken,
  Indexcontroller.StaffSalary.processPayment
);

router.get(
  '/all-staff-salaries',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('viewAllStaffSalaries'),
  authenticateToken,
  Indexcontroller.StaffSalary.listPayments
);

router.patch(
  '/update-base-salary/:staffId',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('updateSalary'),
  authenticateToken,
  Indexcontroller.StaffSalary.updateStaffBaseSalary
);

router.delete(
  '/delete-payment/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('deletePayment'),
  authenticateToken,
  Indexcontroller.StaffSalary.softDeletePayment
);

router.get(
  '/staff-summary/:staffId',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('staffSummary'),
  authenticateToken,
  Indexcontroller.StaffSalary.getStaffSalarySummary
);

router.get(
  '/staff-salary-details',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('viewActiveLog'),
  authenticateToken,
  Indexcontroller.StaffSalary.getAllSaffSalaryDetail
);

router.get(
  '/get-company-monthly-summary',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('viewCompanySummary'),
  authenticateToken,
  Indexcontroller.StaffSalary.getCompanyMonthSummary
);
export default router;
