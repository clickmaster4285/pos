import mongoose from 'mongoose';
import Branch from '../models/branch.model.js';
import Company from '../models/company.model.js';
import { validationResult } from 'express-validator';

// Helper functions
const checkAccessPermission = (user, branch, requiredPermission = 'view') => {
   // Super Admin has all access
   if (user.role === 'superAdmin') return true;

   // User must belong to the same company
   if (user.companyId !== branch.companyId) return false;

   // Admin has full access to their company branches
   if (user.role === 'admin') return true;

   // Staff: If they're manager of this branch OR have required permission via middleware
   if (user.role === 'staff') {
      const isManager = branch.managers?.some(m =>
         m.userId === user.userId && ['manager', 'supervisor'].includes(m.role)
      );

      // Middleware already checked permissions, so allow if they're branch manager
      return isManager;
   }

   return false;
};

const checkBranchLimit = async (companyId) => {
   try {
      const company = await Company.findOne({ companyId })
      // .populate('plan.planId');

      if (!company || !company.plan || company.plan.length === 0) {
         return { allowed: false, message: 'No active plan found' };
      }

      const currentPlan = company.plan[0];
      console.log("currentPlan: ", currentPlan)

      // const planDetails = currentPlan.planId;
      // console.log("planDetails: ", planDetails)

      // Check if branch feature is included in plan
      if
         //  (!planDetails.features || !planDetails.features.includes('Branch'))
         (!currentPlan.limitations || !currentPlan.limitations.features ||
         !currentPlan.limitations.features.includes('Branch')) {
         return {
            allowed: false,
            message: 'Branch feature not available in your plan'
         };
      }

      // Check max branch limit
      const branchCount = await Branch.countDocuments({
         companyId,
         isDeleted: false
      });

      // const maxBranches = planDetails.maxBranch || 1;
      const maxBranches = currentPlan.limitations.maxBranch || 1;

      if (branchCount >= maxBranches) {
         return {
            allowed: false,
            message: `Plan limit reached. Maximum ${maxBranches} branch(es) allowed`
         };
      }

      return { allowed: true, remaining: maxBranches - branchCount };
   } catch (error) {
      console.error('Error checking branch limit:', error);
      return { allowed: false, message: 'Error checking plan limits' };
   }
};

const validateManager = async (userId, companyId) => {
   // Check if user exists in company staff
   // This would require a User model check
   // For now, we'll assume validation happens elsewhere
   return true;
};

const formatResponse = (branch, user) => {
   const branchObj = branch.toObject ? branch.toObject() : branch;

   // Remove sensitive/internal fields
   const { __v, isDeleted, ...safeData } = branchObj;

   // Add virtual/calculated fields
   const response = {
      ...safeData,
      fullAddress: `${safeData.address?.street || ''}, ${safeData.address?.city || ''}, ${safeData.address?.country || ''}`.trim(),
      primaryManager: safeData.managers?.find(m => m.role === 'manager') || safeData.managers?.[0]
   };

   return response;
};

const buildBranchQuery = (user, filters = {}) => {
   const query = { isDeleted: false };

   // Apply user role-based filtering
   if (user.role === 'superAdmin') {
      // Super Admin sees all branches
   } else if (user.role === 'admin') {
      // Admin sees only their company branches
      query.companyId = user.companyId;
   } else if (user.role === 'staff') {
      // Staff sees branches based on permissions
      query.companyId = user.companyId;

      // If staff doesn't have viewAllBranches permission (checked by middleware),
      // they only see branches they manage
      if (!user.permissions?.viewAllBranches) {
         query.$or = [
            { managers: { $elemMatch: { userId: user.userId } } }
         ];
      }
   }

   // Apply additional filters
   if (filters.companyId) query.companyId = filters.companyId;
   if (filters.status) query.status = filters.status;
   if (filters.city) query["address.city"] = filters.city;
   if (filters.type) query.type = filters.type;
   if (filters.search) {
      query.$or = [
         { name: { $regex: filters.search, $options: 'i' } },
         { branchCode: { $regex: filters.search, $options: 'i' } },
         { "address.city": { $regex: filters.search, $options: 'i' } }
      ];
   }

   return query;
};

// Main Controller Functions
const createBranch = async (req, res) => {
   try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({
            success: false,
            errors: errors.array(),
            message: 'Validation failed'
         });
      }

      const {
         companyId,
         branchId,
         name,
         address,
         contact,
         type,
         settings,
         managers,
         monthlyTarget
      } = req.body;

      // Check if branchId already exists
      const existingBranch = await Branch.findOne({
         branchId,
         isDeleted: false
      });

      if (existingBranch) {
         return res.status(400).json({
            success: false,
            message: 'Branch ID already exists'
         });
      }

      // Check company's plan limits
      const planCheck = await checkBranchLimit(companyId);
      if (!planCheck.allowed) {
         return res.status(403).json({
            success: false,
            message: planCheck.message,
            errorType: 'plan_limit'
            // Remove the planDetails object as it's not available here
         });
      }

      // Validate managers if provided
      if (managers && managers.length > 0) {
         for (const manager of managers) {
            const isValid = await validateManager(manager.userId, companyId);
            if (!isValid) {
               return res.status(400).json({
                  success: false,
                  message: `Invalid manager: ${manager.userId}`
               });
            }
         }
      }

      // Create new branch
      const branch = new Branch({
         companyId,
         branchId,
         name,
         address: {
            ...address,
            country: address.country || 'Pakistan'
         },
         contact,
         type: type || 'restaurant',
         settings: {
            taxRate: settings?.taxRate || 16,
            currency: settings?.currency || 'PKR',
            ...settings
         },
         managers: managers?.map(manager => ({
            ...manager,
            assignedAt: new Date(),
            assignedBy: req.user.userId
         })) || [],
         monthlyTarget: monthlyTarget || 0,
         createdBy: req.user.userId,
         status: 'active'
      });

      await branch.save();

      res.status(201).json({
         success: true,
         message: 'Branch created successfully',
         data: formatResponse(branch, req.user)
      });

   } catch (error) {
      console.error('Create branch error:', error);

      if (error.code === 11000) {
         return res.status(400).json({
            success: false,
            message: 'Branch with this code or ID already exists'
         });
      }

      res.status(500).json({
         success: false,
         message: 'Failed to create branch',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

const getBranches = async (req, res) => {
   try {
      const {
         companyId,
         status,
         city,
         type,
         page = 1,
         limit = 20,
         sortBy = 'createdAt',
         sortOrder = 'desc',
         search,
         lightweight = false
      } = req.query;

      // Build query based on user role and filters
      const filters = { companyId, status, city, type, search };
      const query = buildBranchQuery(req.user, filters);

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Select fields based on lightweight flag
      const selectFields = lightweight === 'true' ?
         'name branchCode status address.city managers' :
         '-__v -isDeleted';

      // Execute query
      const [branches, total] = await Promise.all([
         Branch.find(query)
            .select(selectFields)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
         Branch.countDocuments(query)
      ]);

      // Format response
      const formattedBranches = branches.map(branch =>
         formatResponse(branch, req.user)
      );

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.status(200).json({
         success: true,
         data: formattedBranches,
         pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext,
            hasPrev
         }
      });

   } catch (error) {
      console.error('Get branches error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch branches'
      });
   }
};

const getBranchById = async (req, res) => {
   try {
      const { id } = req.params;

      // Find branch
      const query = {
         $or: [{ branchId: id }, { _id: id }],
         isDeleted: false
      };

      const branch = await Branch.findOne(query);

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check access permissions
      if (!checkAccessPermission(req.user, branch, 'view')) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to access this branch'
         });
      }

      res.status(200).json({
         success: true,
         data: formatResponse(branch, req.user)
      });

   } catch (error) {
      console.error('Get branch by ID error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch branch'
      });
   }
};

const updateBranch = async (req, res) => {
   try {
      const { id } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({
            success: false,
            errors: errors.array()
         });
      }

      // Find branch
      const query = {
         $or: [{ branchId: id }, { _id: id }],
         isDeleted: false
      };

      const branch = await Branch.findOne(query);

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check permissions
      const canManage = checkAccessPermission(req.user, branch, 'manage');
      if (!canManage) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to update this branch'
         });
      }

      // Fields that can be updated (different for admins vs managers)
      const updatableFields = ['name', 'address', 'contact', 'status', 'monthlyTarget'];

      // Update allowed fields
      updatableFields.forEach(field => {
         if (req.body[field] !== undefined) {
            branch[field] = req.body[field];
         }
      });

      // Handle managers update (only for admins)
      if (req.body.managers !== undefined) {
         // Validate managers
         for (const manager of req.body.managers) {
            const isValid = await validateManager(manager.userId, branch.companyId);
            if (!isValid) {
               return res.status(400).json({
                  success: false,
                  message: `Invalid manager: ${manager.userId}`
               });
            }
         }

         branch.managers = req.body.managers.map(manager => ({
            ...manager,
            assignedAt: manager.assignedAt || new Date(),
            assignedBy: manager.assignedBy || req.user.userId
         }));
      }

      branch.updatedAt = new Date();
      branch.updatedBy = req.user.userId;

      await branch.save();

      res.status(200).json({
         success: true,
         message: 'Branch updated successfully',
         data: formatResponse(branch, req.user)
      });

   } catch (error) {
      console.error('Update branch error:', error);

      if (error.code === 11000) {
         return res.status(400).json({
            success: false,
            message: 'Branch code already exists'
         });
      }

      res.status(500).json({
         success: false,
         message: 'Failed to update branch'
      });
   }
};

const deleteBranch = async (req, res) => {
   try {
      const { id } = req.params;
      const { reason } = req.body;

      const query = {
         $or: [{ branchId: id }, { _id: id }],
         isDeleted: false
      };

      const branch = await Branch.findOne(query);

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check if user belongs to same company
      if (req.user.companyId !== branch.companyId) {
         return res.status(403).json({
            success: false,
            message: 'Cannot delete branch from another company'
         });
      }


      // Soft delete
      branch.isDeleted = true;
      branch.deletedAt = new Date();
      branch.deletedBy = req.user.userId;
      branch.deleteReason = reason || 'No reason provided';
      branch.status = 'inactive';

      await branch.save();

      res.status(200).json({
         success: true,
         message: 'Branch deleted successfully'
      });

   } catch (error) {
      console.error('Delete branch error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete branch'
      });
   }
};

const restoreBranch = async (req, res) => {
   try {
      const { id } = req.params;

      const branch = await Branch.findOne({
         $or: [{ branchId: id }, { _id: id }],
         isDeleted: true
      });

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Deleted branch not found'
         });
      }

      // Restore branch
      branch.isDeleted = false;
      branch.deletedAt = null;
      branch.deletedBy = null;
      branch.deleteReason = null;
      branch.status = 'active';
      branch.updatedAt = new Date();
      branch.updatedBy = req.user.userId;

      await branch.save();

      res.status(200).json({
         success: true,
         message: 'Branch restored successfully',
         data: formatResponse(branch, req.user)
      });

   } catch (error) {
      console.error('Restore branch error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to restore branch'
      });
   }
};

// Export all functions
export default {
   createBranch,
   getBranches,
   getBranchById,
   updateBranch,
   deleteBranch,
   restoreBranch,
   // Helper functions for testing (optional)
   _helpers: {
      checkAccessPermission,
      checkBranchLimit,
      buildBranchQuery
   }
};