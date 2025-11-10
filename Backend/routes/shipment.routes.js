import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import passport from '../middleware/passportAuth.middleware.js';
import { checkPermissionsValidation } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-shippment',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('createShipment'),
  Indexcontroller.Shippment.createShipment
);

router.get(
  '/get-all-shipments',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('viewShipment'),
  Indexcontroller.Shippment.listShipments
);

router.get(
  '/get-shippment-by-id/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('viewShipment'),
  Indexcontroller.Shippment.getShipmentById
);

router.get(
  '/awb/:awb',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('viewShipment'),
  Indexcontroller.Shippment.getShipmentByAwb
);

router.patch(
  '/update-shippment/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('updateShipment'),
  Indexcontroller.Shippment.updateShipment
);

router.patch(
  '/update-shippment-status/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('updateShipment'),
  Indexcontroller.Shippment.updateStatus
);

// router.patch(
//   '/add-checkpoint/:id',
//   passport.authenticate('jwt', { session: false }),
//   authenticateToken,
  // checkPermissionsValidation('updateShipment'),
//   Indexcontroller.Shippment.addCheckpoint
// );

router.patch(
  '/cancel-shippment/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('updateShipment'),
  Indexcontroller.Shippment.cancelShipment
);

router.patch(
  '/soft-delete-shippment/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('deleteShipment'),
  Indexcontroller.Shippment.softDeleteShipment
);

router.patch(
  'restore-shippment/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('updateShipment'),
  Indexcontroller.Shippment.restoreShipment
);

export default router;
