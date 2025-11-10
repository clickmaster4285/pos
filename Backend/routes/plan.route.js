import express from 'express';
import passport from '../middleware/passportAuth.middleware.js';
import Indexcontroller from '../controllers/indexController.js';
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  '/create-plan',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Plan.createPlan
);

//GET ALL PLANS ROUTE
router.get(
  '/get-all-plans',
  // passport.authenticate('jwt', { session: false }),
  Indexcontroller.Plan.getAllPlans
);

router.patch(
  '/update-plan/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Plan.updatePlan
);

router.delete(
  '/delete-plan/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Plan.deletePlan
);

router.get(
  '/get-all-plans-for-user',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.Plan.getAllPlansforUser
);

export default router;
