import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import {
  checkplan,
  checkPermissionsValidation,
} from '../middleware/authMiddleware.js';
import ErrorResponse from '../utils/errorResponse.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-table',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.createTable
);
router.get(
  '/list-table',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.listTables
);
router.get(
  '/get-table-by/:id',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.getTable
);
router.patch(
  '/update-table/:id',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.updateTable
);
router.delete(
  '/remove-table/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.removeTable
);

router.post(
  '/assign-waiter/:id',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.assignWaiter
);
router.post(
  '/clear-waiter/:id',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.clearWaiter
);

router.post(
  '/reserve/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.setReservation
);
router.post(
  '/cancel-reservation/:id',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.cancelReservation
);

router.post(
  '/mark-occupied/:id',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.markOccupied
);
router.post(
  '/mark-awaiting-payment/:id',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.markAwaitingPayment
);
router.post(
  '/mark-available/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.markAvailable
);
router.get(
  '/get-order-by-table',
  passport.authenticate('jwt', { session: false }),
   checkPermissionsValidation('manageTables'),
  authenticateToken,
  Indexcontroller.Table.getActiveDineInOrderByTable
);

export default router;
