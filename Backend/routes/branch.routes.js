// backend\routes\branch.routes.js
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
         if (user.role === 'superAdmin') {
            return next();
         }

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

// Unified branches endpoint - GET all branches with filters
router.get(
   '/',
   authorize(['admin', 'manager', 'superAdmin', 'staff']),
   checkPermissionsValidation('viewAllBranches'),
   BranchValidator.validateQuery,
   BranchController.getBranches
);

// Get single branch by ID
router.get(
   '/:id',
   authorize(['admin', 'manager', 'superAdmin', 'staff']),
   BranchController.getBranchById
);

// Update branch - includes manager management
router.put(
   '/:id',
   authorize(['admin', 'manager', 'superAdmin']),
   checkPermissionsValidation('editBranch'),
   BranchValidator.validateUpdate,
   BranchController.updateBranch
);

// Delete branch
router.delete(
   '/:id',
   authorize(['admin', 'superAdmin']),
   checkPermissionsValidation('deleteBranches'),
   BranchController.deleteBranch
);

// Restore deleted branch
router.post(
   '/:id/restore',
   authorize(['admin', 'superAdmin']),
   BranchController.restoreBranch
);

export default router;