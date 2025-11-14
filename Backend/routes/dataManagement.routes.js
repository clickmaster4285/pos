// routes/dataManagementRoutes.js
import express from 'express';
import { 
  exportAllData, 
  importData, 
  getBackupInfo,
  cleanupTempFiles ,
  exportCompanyData,
  importCompanyData,
} from '../backup/dataManagement.controller.js';
import passport from '../middleware/passportAuth.middleware.js';

const router = express.Router();

// Data management routes - only for super admins
router.get('/export-all-data', 
  passport.authenticate('jwt', { session: false }), 
  exportAllData
);

router.get('/export-company-data', 
  passport.authenticate('jwt', { session: false }), 
  exportCompanyData
);

router.post('/import-data', 
  passport.authenticate('jwt', { session: false }), 
  importData
);

router.post('/import-company-data/:companyId', 
  passport.authenticate('jwt', { session: false }), 
  importCompanyData
);

router.get('/backup-info', 
  passport.authenticate('jwt', { session: false }), 
  getBackupInfo
);

router.delete('/cleanup-temp', 
  passport.authenticate('jwt', { session: false }), 
  cleanupTempFiles
);

export default router;