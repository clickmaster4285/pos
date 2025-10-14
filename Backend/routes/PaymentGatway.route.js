import express from 'express';
import Indexcontroller from '../controllers/indexController.js';
import webhook from "../webhook/webhook.js";
import passport from '../middleware/passportAuth.middleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/strip-webhook',
  
  webhook.stripWebhook
);

router.post(
  '/create-payment-intent',
  passport.authenticate("jwt", { session: false }),
  Indexcontroller.PaymentGatway.createPaymentIntent
);




export default router;
