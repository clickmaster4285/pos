// src/routes/product.route.js
import express from 'express';
import IndexController from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import { authenticateToken, checkPlanIsActive, checkPermissionsValidation } from '../middleware/authMiddleware.js';
import { checkplan } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-product',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('createProduct'),
  checkplan('Product'),
  IndexController.Product.createProduct
);

router.get(
  '/get-all-product',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewProduct'),
  IndexController.Product.getAllProducts
);

router.get(
  '/get-product-by-id/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewProduct'),
  IndexController.Product.getProductById
);

router.patch(
  '/update-product/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('updateProduct'),
  checkplan('Product'),
  IndexController.Product.updateProduct
);

router.delete(
  '/delete-product/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('deleteProduct'),
  checkplan('Product'),
  IndexController.Product.deleteProduct
);

router.patch(
  '/status-update-product/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('updateProduct'),
  checkplan('Product'),
  IndexController.Product.toggleProductStatus
);

router.patch(
  '/update-product-stock',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('createProduct'),
  checkplan('Product'),
  IndexController.Product.updateProductStock
);

router.get(
  '/search',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewProduct'),
  IndexController.Product.searchProducts
);

export default router;