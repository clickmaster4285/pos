import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post(
  '/create-product',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Product.createProduct
);

router.get(
  '/get-all-product',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Product.getAllProducts
);

router.patch(
  '/update-product/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Product.updateProduct
);

router.delete(
  '/delete-product/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Product.deleteProduct
);

router.patch(
  '/status-update-product/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Product.toggleProductStatus
);

router.patch(
  '/update-product-stock',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Product.updateProductStock
);

export default router;