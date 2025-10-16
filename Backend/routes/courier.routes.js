import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import passport from '../middleware/passportAuth.middleware.js';

const router = express.Router();

// /api/couriers
router.get(
  '/get-all-courier',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Courier.listCouriers
);

router.get(
  '/get-courier-by-id/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Courier.getCourier
);
router.post(
  '/create-courier',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Courier.createCourier
);
router.patch(
  '/update-courier/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Courier.updateCourier
);
router.patch(
  '/update-credentials/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Courier.updateCredentials
);
router.post(
  '/auth-test/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Courier.authTestCourier
);
router.delete(
  '/delete-courier/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Courier.deleteCourier
);

export default router;
