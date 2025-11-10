import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import ErrorResponse from '../utils/errorResponse.js';
import { checkPermissionsValidation } from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-order',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('createOrder'),
  Indexcontroller.Orders.createOrder
);

router.get(
  '/get-all-order',
  passport.authenticate('jwt', { session: false }),
 checkPermissionsValidation('viewOrder'),
  Indexcontroller.Orders.listCompanyOrders
);
router.get(
  '/get-order-by-id/:id',
  passport.authenticate('jwt', { session: false }),
 checkPermissionsValidation('viewOrder'),
  Indexcontroller.Orders.getOrderById
);

router.patch(
  '/cancel-order/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('updateOrderStatus'),
  Indexcontroller.Orders.cancelOrder
);

router.patch(
  '/update-order-status/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPermissionsValidation('updateOrderStatus'),
  Indexcontroller.Orders.updateOrderStatus
);


export default router;
