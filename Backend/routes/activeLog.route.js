import express from 'express';
import passport from '../middleware/passportAuth.middleware.js';
import Indexcontroller from '../controllers/indexController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';


const router = express.Router();

router.get(
  '/all-activity',
  //passport.authenticate('jwt', { session: false }),
 // authenticateToken,
  Indexcontroller.ActiveLog.getAllActivity
);

router.get(
  '/activity-by-userId/:userId',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  Indexcontroller.ActiveLog.getUserActivity
);

export default router;
