// src/routes/billing.route.js
import express from 'express';
import IndexController from '../controllers/indexController.js';
import passport from '../middleware/passportAuth.middleware.js';
import { authenticateToken, checkPermissionsValidation, checkPlanIsActive } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/create-bill',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('addBilling'),
  IndexController.Bill.createBill
);

router.get(
  '/get-all-bills',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewBilling'),
  IndexController.Bill.getBills
);

router.get(
  '/get-bill/:id',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('viewBilling'),
  IndexController.Bill.getBillById
);

router.patch(
  '/update-bills-status/:billId',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('editBilling'),
  IndexController.Bill.updateItemStatus
);

router.delete(
  '/delete-bill/:billId',
  passport.authenticate('jwt', { session: false }),
  authenticateToken,
  checkPlanIsActive,
  checkPermissionsValidation('deleteBilling'),
  IndexController.Bill.deleteBill
);

router.post('/notify-test', (req, res) => {
  try {
    console.log('🔥 /notify-test hit. Body:', req.body);

    // 1) Check if emitNotification is registered
    const emitNotification = req.app.get('emitNotification');
    console.log('emitNotification exists?', !!emitNotification);

    if (!emitNotification) {
      return res.status(500).json({
        success: false,
        message: 'emitNotification not registered on app. Check initSocket().',
      });
    }

    // 2) Get userId from body only (do NOT rely on req.user for this test)
    const { userId, title, message } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required in body for /notify-test',
      });
    }

    // 3) Emit the notification
    emitNotification(String(userId), {
      type: 'TEST',
      title: title || 'Test Notification',
      message: message || 'Hello from backend /notify-test',
      meta: { from: 'billing-notify-test' },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error in /notify-test:', err);
    return res
      .status(500)
      .json({ success: false, message: err.message || 'Error' });
  }
});

export default router;