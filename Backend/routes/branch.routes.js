// backend\routes\branch.routes.js
import express from 'express';
import BranchController from '../controllers/branch.controller.js';
import BranchValidator from '../middleware/branchValidator.js';
import { authenticateToken, checkPermissionsValidation } from '../middleware/authMiddleware.js'; // ADD authenticateToken

const router = express.Router();

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

router.use(authenticateToken);

router.post(
   '/',
   checkPermissionsValidation('createBranch'),
   BranchValidator.validateCreate,
   BranchController.createBranch
);

router.get(
   '/',
   checkPermissionsValidation('viewAllBranches'),
   BranchValidator.validateQuery,
   BranchController.getBranches
);

router.get(
   '/:id',
   BranchController.getBranchById
);

router.put(
   '/:id',
   // authorize(['admin', 'manager', 'superAdmin']),
   checkPermissionsValidation('editBranch'),
   BranchValidator.validateUpdate,
   BranchController.updateBranch
);

router.delete(
   '/:id',
   checkPermissionsValidation('deleteBranches'),
   BranchController.deleteBranch
);

router.post(
   '/:id/restore',
   BranchController.restoreBranch
);

export default router;