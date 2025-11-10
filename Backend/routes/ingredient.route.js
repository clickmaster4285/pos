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
  checkPermissionsValidation('createIngredient'),
  IndexController.Ingredient.createIngredient
);

router.get(
  '/get-all-ingredient',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewIngredient'),
  IndexController.Ingredient.getAllIngredients
);

router.get(
  '/get-ingredient-by-id/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewIngredient'),
  IndexController.Ingredient.getIngredientById
);

router.patch(
  '/update-ingredient/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('updateIngredient'),
  IndexController.Ingredient.updateIngredient
);

router.delete(
  '/delete-ingredient/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('deleteIngredient'),
  IndexController.Ingredient.deleteIngredient
);

router.patch(
  '/status-update-ingredient/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('updateIngredient'),
  IndexController.Ingredient.toggleIngredientStatus
);

router.patch(
  '/update-ingredient-stock',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('updateIngredient'),
  IndexController.Ingredient.updateIngredientStock
);

export default router;