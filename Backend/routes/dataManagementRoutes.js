// routes/dataManagementRoutes.js
import express from 'express';
import { 
  exportAllData, 
  importData, 
  getBackupInfo, 
} from '../backup/dataManagementController.js';
import passport from '../middleware/passportAuth.middleware.js';

const router = express.Router();

// Data management routes - only for super admins
router.get('/export-all-data', passport.authenticate('jwt', { session: false }), exportAllData);
router.post('/import-data', passport.authenticate('jwt', { session: false }), importData);
router.get('/backup-info', passport.authenticate('jwt', { session: false }), getBackupInfo);

export default router;