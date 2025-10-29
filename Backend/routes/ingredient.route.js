// src/routes/product.route.js
import express from 'express';
import IndexController from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import { authenticateToken, checkPlanIsActive, checkPermissionsValidation } from '../middleware/authMiddleware.js';
import { checkplan } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-ingredient',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
//   checkPermissionsValidation('createProduct'),
//   checkplan('Product'),
  IndexController.Ingredient.createIngredient
);

router.get(
  '/get-all-ingredient',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
//   checkPermissionsValidation('viewProduct'),
  IndexController.Ingredient.getAllIngredients
);

router.get(
  '/get-ingredient-by-id/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
//   checkPermissionsValidation('viewProduct'),
  IndexController.Ingredient.getIngredientById
);

router.patch(
  '/update-ingredient/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
//   checkPermissionsValidation('updateProduct'),
//   checkplan('Product'),
  IndexController.Ingredient.updateIngredient
);

router.delete(
  '/delete-ingredient/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
//   checkPermissionsValidation('deleteProduct'),
//   checkplan('Product'),
  IndexController.Ingredient.deleteIngredient
);

router.patch(
  '/status-update-ingredient/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
//   checkPermissionsValidation('updateProduct'),
//   checkplan('Product'),
  IndexController.Ingredient.toggleIngredientStatus
);

router.patch(
  '/update-ingredient-stock',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
//   checkPermissionsValidation('createProduct'),
//   checkplan('Product'),
  IndexController.Ingredient.updateIngredientStock
);

export default router;