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
  '/create-staff',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkplan('staffCreate'),
  Indexcontroller.User.createStaff
);

router.delete(
  '/delete-staff/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('staffDelete'),
  checkPlanIsActive,
  Indexcontroller.User.deleteStaff
);

router.post('/create-user', Indexcontroller.User.registerUser);

router.get(
  '/get-all-staff',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('viewallstaff'),
  authenticateToken,
  Indexcontroller.User.getAllStaff
);

router.patch(
  '/update-staff-byid/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('staffUpdate'),
  authenticateToken,
  Indexcontroller.User.updateStaff
);
router.get(
  '/get-all-users',
  passport.authenticate('jwt', { session: false }),
  Indexcontroller.User.getAllAdminUsers
);

router.get(
  '/get-all-customer-users',
  passport.authenticate('jwt', { session: false }),
  Indexcontroller.User.getAllCustomerUsers
);

router.get(
  '/get-all-users-by-id/:id',
  passport.authenticate('jwt', { session: false }),
  Indexcontroller.User.getUserAllById
);

router.patch(
  '/active_inactive-user/:id',
  passport.authenticate('jwt', { session: false }),
  Indexcontroller.User.active_inactiveUser
);
export default router;
