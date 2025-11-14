// src/routes/companyExcelRoutes.js
import { Router } from 'express';
import { exportCompanyExcel } from '../backup/companyExcel.controller.js';
import passport from '../middleware/passportAuth.middleware.js';

const router = Router();


router.get(
  '/export-company-data',
  passport.authenticate('jwt', { session: false }),
  exportCompanyExcel
);

export default router;