import express from 'express';
import BranchController from '../controllers/branch.controller.js';
import BranchValidator from '../middleware/branchValidator.js';
import { authenticateToken, checkPermissionsValidation } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create authorization middleware
const authorize = (roles) => {
   return async (req, res, next) => {
      try {
         const user = req.user;

         // Super admin has all access
         if (user.role === 'superAdmin' || user.role === 'super_admin') {
            return next();
         }

         // Check if user's role is in the allowed roles array
         if (!roles.includes(user.role)) {
            return res.status(403).json({
               success: false,
               message: 'Insufficient permissions for this action'
            });
         }

         next();
      } catch (error) {
         next(error);
      }
   };
};

// Public routes
router.get(
   '/nearby',
   BranchValidator.validateNearby,
   BranchController.findNearbyBranches
);

// Protected routes (require authentication)
router.use(authenticateToken);

// Branch CRUD operations
router.post(
   '/',
   authorize(['admin', 'super_admin']),
   BranchValidator.validateCreate,
   BranchController.createBranch
);

router.get(
   '/company/:companyId',
   authorize(['admin', 'manager', 'superAdmin', 'staff']),
   BranchValidator.validateQuery,
   BranchController.getCompanyBranches
);

router.get(
   '/manager/:userId',
   authorize(['admin', 'manager', 'super_admin']),
   BranchController.getBranchesByManager
);

router.get(
   '/:id',
   authorize(['admin', 'manager', 'super_admin', 'staff']),
   BranchController.getBranchById
);

router.put(
   '/:id',
   authorize(['admin', 'manager', 'super_admin']),
   BranchValidator.validateUpdate,
   BranchController.updateBranch
);

router.delete(
   '/:id',
   authorize(['admin', 'super_admin']),
   BranchController.deleteBranch
);

// Manager management
router.post(
   '/:id/managers',
   authorize(['admin', 'super_admin']),
   BranchValidator.validateAddManager,
   BranchController.addManager
);

router.delete(
   '/:id/managers/:userId',
   authorize(['admin', 'super_admin']),
   BranchController.removeManager
);

// Statistics and dashboard
router.post(
   '/:id/stats',
   authorize(['admin', 'manager', 'super_admin', 'system']),
   BranchController.updateBranchStats
);

router.get(
   '/:id/dashboard',
   authorize(['admin', 'manager', 'super_admin']),
   BranchController.getBranchDashboard
);

// Restoration
router.post(
   '/:id/restore',
   authorize(['admin', 'super_admin']),
   BranchController.restoreBranch
);

export default router;