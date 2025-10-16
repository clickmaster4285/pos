// middleware/requireActiveSubscription.js
import IndexModel from '../models/index.model.js';
import { isSubscriptionActive } from '../utils/subscription.js';

export const requireActiveSubscription = () => async (req, res, next) => {
  const me = await IndexModel.User.findById(req.user.id).select('subscription');

  // allow free endpoints if you want
  if (me?.subscription?.plan === 'free') return next();

  if (!isSubscriptionActive(me?.subscription)) {
    return res.status(402).json({
      success: false,
      message: 'Your subscription has expired. Please renew to continue.',
      endsAt:
        me?.subscription?.currentPeriodEnd ||
        me?.subscription?.trialEnd ||
        null,
    });
  }
  next();
};
