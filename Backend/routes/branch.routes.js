import express from 'express';
import BranchController from '../controllers/branch.controller.js';
import BranchValidator from '../middleware/branchValidator.js';
import { authenticateToken, checkPermissionsValidation } from '../middleware/authMiddleware.js';
import passport from '../middleware/passportAuth.middleware.js';

const router = express.Router();

// Create authorization middleware
const authorize = (roles) => {
   return async (req, res, next) => {
      try {
         const user = req.user;

         // Super admin has all access
         if (user.role === 'superAdmin') {
            return next();
         }
         console.log("the user is ", user.role)
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
   authorize(['admin', 'superAdmin']),
   checkPermissionsValidation('createBranch'),
   BranchValidator.validateCreate,
   BranchController.createBranch
);

router.get(
   '/company/:companyId',
     passport.authenticate('jwt', { session: false }),
   // authorize(['admin', 'manager', 'superAdmin', 'staff']),
   checkPermissionsValidation('ViewAllBranches'),
   BranchValidator.validateQuery,
   BranchController.getCompanyBranches
);

router.get(
   '/manager/:userId',
   authorize(['admin', 'manager', 'superAdmin']),
   BranchController.getBranchesByManager
);

router.get(
   '/:id',
   authorize(['admin', 'manager', 'superAdmin', 'staff']),
   BranchController.getBranchById
);

router.put(
   '/:id',
   authorize(['admin', 'manager', 'superAdmin']),
   checkPermissionsValidation('editBranch'),
   BranchValidator.validateUpdate,
   BranchController.updateBranch
);

router.delete(
   '/:id',
   authorize(['admin', 'superAdmin']),
   checkPermissionsValidation('DeleteBranches'),
   BranchController.deleteBranch
);

// Manager management
router.post(
   '/:id/managers',
   authorize(['admin', 'superAdmin']),
   BranchValidator.validateAddManager,
   BranchController.addManager
);

router.delete(
   '/:id/managers/:userId',
   authorize(['admin', 'superAdmin']),
   BranchController.removeManager
);

// Statistics and dashboard
router.post(
   '/:id/stats',
   authorize(['admin', 'manager', 'superAdmin', 'system']),
   BranchController.updateBranchStats
);

router.get(
   '/:id/dashboard',
   authorize(['admin', 'manager', 'superAdmin']),
   BranchController.getBranchDashboard
);

// Restoration
router.post(
   '/:id/restore',
   authorize(['admin', 'superAdmin']),
   BranchController.restoreBranch
);

export default router;