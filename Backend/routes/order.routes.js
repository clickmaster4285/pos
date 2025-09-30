import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import ErrorResponse from '../utils/errorResponse.js';
import { checkOrderValidation } from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-order',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Order.createOrder
);

router.put(
  '/update-order-status/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Order.updateOrderStatus
);

router.get(
  '/get-all-order/',
  passport.authenticate('jwt', { session: false }),
  // checkOrderValidation,
  Indexcontroller.Order.getOrders
);

router.put(
  '/cancel-order/:id/:itemIds',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Order.cancelOrderItems
);

router.put(
  '/return-order/:id/:itemIds',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Order.return_refundOrder
);

router.put(
  '/return-request-update/:id/:itemId',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  // checkOrderValidation,
  Indexcontroller.Order.handleReturnRequest
);
export default router;
