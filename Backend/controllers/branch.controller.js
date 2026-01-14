import mongoose from 'mongoose';
import Branch from '../models/branch.model.js';
import { validationResult } from 'express-validator';

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
            assignedAt: new Date()
         })) || [],
         monthlyTarget: monthlyTarget || 0,
         createdBy: req.user.userId,
         status: 'active'
      });

      await branch.save();

      // Return branch without sensitive data
      const branchResponse = branch.toJSON();

      res.status(201).json({
         success: true,
         message: 'Branch created successfully',
         data: branchResponse
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

const getCompanyBranches = async (req, res) => {
   try {
      const { companyId } = req.params;
      const {
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

      // Validate company access
      if (req.user.companyId !== companyId && !req.user.isSuperAdmin) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to access these branches'
         });
      }

      // Build query
      const query = {
         companyId,
         isDeleted: false
      };

      // Apply filters
      if (status) query.status = status;
      if (city) query["address.city"] = city;
      if (type) query.type = type;

      // Search functionality
      if (search) {
         query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { branchCode: { $regex: search, $options: 'i' } },
            { "address.city": { $regex: search, $options: 'i' } }
         ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [branches, total] = await Promise.all([
         Branch.find(query)
            .select(lightweight === 'true' ?
               'name branchCode status address.city managers' :
               '-__v -isDeleted'
            )
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
         Branch.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.status(200).json({
         success: true,
         data: branches,
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
      console.error('Get company branches error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch branches'
      });
   }
};

const getBranchById = async (req, res) => {
   try {
      const { id } = req.params;
      const { includeDeleted = false } = req.query;

      // Build query
      const query = includeDeleted === 'true' ?
         { $or: [{ branchId: id }, { _id: id }] } :
         { $or: [{ branchId: id }, { _id: id }], isDeleted: false };

      const branch = await Branch.findOne(query)
         .select('-__v -isDeleted')
         .lean();

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check access permissions
      const hasAccess =
         req.user.isSuperAdmin ||
         req.user.companyId === branch.companyId ||
         branch.managers.some(m => m.userId === req.user.userId);

      if (!hasAccess) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to access this branch'
         });
      }

      // Add virtual fields
      const branchWithVirtuals = new Branch(branch);
      const responseData = {
         ...branch,
         fullAddress: branchWithVirtuals.fullAddress,
         primaryManager: branchWithVirtuals.primaryManager
      };

      res.status(200).json({
         success: true,
         data: responseData
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

      const query = { $or: [{ branchId: id }, { _id: id }], isDeleted: false };
      const branch = await Branch.findOne(query);

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check permissions (Admin or branch manager)
      const isManager = branch.managers.some(m =>
         m.userId === req.user.userId && ['manager', 'supervisor'].includes(m.role)
      );

      if (!req.user.isSuperAdmin && !isManager && req.user.companyId !== branch.companyId) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to update this branch'
         });
      }

      // Fields that can be updated
      const updatableFields = [
         'name',
         'address',
         'contact',
         'type',
         'settings',
         'status',
         'monthlyTarget'
      ];

      // Update allowed fields
      updatableFields.forEach(field => {
         if (req.body[field] !== undefined) {
            branch[field] = req.body[field];
         }
      });

      branch.updatedBy = req.user.userId;

      // Handle managers update separately if provided
      if (req.body.managers) {
         // Only admins can update managers
         if (!req.user.isSuperAdmin && req.user.companyId !== branch.companyId) {
            return res.status(403).json({
               success: false,
               message: 'Not authorized to update managers'
            });
         }
         branch.managers = req.body.managers;
      }

      await branch.save();

      res.status(200).json({
         success: true,
         message: 'Branch updated successfully',
         data: branch.toJSON()
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

      const query = { $or: [{ branchId: id }, { _id: id }], isDeleted: false };
      const branch = await Branch.findOne(query);

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Only super admin or company admin can delete
      if (!req.user.isSuperAdmin && req.user.companyId !== branch.companyId) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this branch'
         });
      }

      // Perform soft delete
      branch.softDelete(req.user.userId, reason || 'No reason provided');
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

const addManager = async (req, res) => {
   try {
      const { id } = req.params;
      const { userId, role = 'manager' } = req.body;

      const query = { $or: [{ branchId: id }, { _id: id }], isDeleted: false };
      const branch = await Branch.findOne(query);

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check permissions
      if (!req.user.isSuperAdmin && req.user.companyId !== branch.companyId) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to manage this branch'
         });
      }

      // Add manager
      branch.addManager(userId, role, req.user.userId);
      await branch.save();

      res.status(200).json({
         success: true,
         message: 'Manager added successfully',
         data: branch.managers
      });

   } catch (error) {
      console.error('Add manager error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to add manager'
      });
   }
};

const removeManager = async (req, res) => {
   try {
      const { id, userId } = req.params;
      const { reason } = req.body;

      const query = { $or: [{ branchId: id }, { _id: id }], isDeleted: false };
      const branch = await Branch.findOne(query);

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check permissions
      if (!req.user.isSuperAdmin && req.user.companyId !== branch.companyId) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to manage this branch'
         });
      }

      // Remove manager
      branch.removeManager(userId, req.user.userId, reason || 'No reason provided');
      await branch.save();

      res.status(200).json({
         success: true,
         message: 'Manager removed successfully',
         data: branch.managers
      });

   } catch (error) {
      console.error('Remove manager error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to remove manager'
      });
   }
};

const getBranchesByManager = async (req, res) => {
   try {
      const { userId } = req.params;

      // Check if user is requesting their own branches or is admin
      if (req.user.userId !== userId && !req.user.isSuperAdmin) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to view these branches'
         });
      }

      const branches = await Branch.findByManager(userId);

      res.status(200).json({
         success: true,
         data: branches
      });

   } catch (error) {
      console.error('Get branches by manager error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch branches'
      });
   }
};

const findNearbyBranches = async (req, res) => {
   try {
      const { lat, lng, radius = 5 } = req.query;

      if (!lat || !lng) {
         return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
         });
      }

      const branches = await Branch.findNearby(
         parseFloat(lat),
         parseFloat(lng),
         parseFloat(radius)
      );

      res.status(200).json({
         success: true,
         data: branches
      });

   } catch (error) {
      console.error('Find nearby branches error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to find nearby branches'
      });
   }
};

const updateBranchStats = async (req, res) => {
   try {
      const { id } = req.params;
      const { orders, revenue, items } = req.body;

      const query = { $or: [{ branchId: id }, { _id: id }], isDeleted: false };
      const branch = await Branch.findOne(query);

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check if user has access to update stats
      const hasAccess =
         req.user.isSuperAdmin ||
         req.user.companyId === branch.companyId ||
         branch.managers.some(m => m.userId === req.user.userId);

      if (!hasAccess) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to update branch statistics'
         });
      }

      // Update stats
      branch.updateStats({
         orders: orders || 0,
         revenue: revenue || 0,
         items: items || 0
      });

      await branch.save();

      res.status(200).json({
         success: true,
         message: 'Statistics updated successfully',
         data: branch.stats
      });

   } catch (error) {
      console.error('Update branch stats error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update statistics'
      });
   }
};

const getBranchDashboard = async (req, res) => {
   try {
      const { id } = req.params;

      const query = { $or: [{ branchId: id }, { _id: id }], isDeleted: false };
      const branch = await Branch.findOne(query)
         .select('name branchCode status stats monthlyTarget managers settings')
         .lean();

      if (!branch) {
         return res.status(404).json({
            success: false,
            message: 'Branch not found'
         });
      }

      // Check access
      const hasAccess =
         req.user.isSuperAdmin ||
         req.user.companyId === branch.companyId ||
         branch.managers.some(m => m.userId === req.user.userId);

      if (!hasAccess) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to view dashboard'
         });
      }

      // Calculate dashboard metrics
      const dashboard = {
         branchInfo: {
            name: branch.name,
            branchCode: branch.branchCode,
            status: branch.status
         },
         performance: {
            monthlyTarget: branch.monthlyTarget || 0,
            currentRevenue: branch.stats?.totalRevenue || 0,
            progressPercentage: branch.monthlyTarget > 0 ?
               Math.min(100, (branch.stats?.totalRevenue / branch.monthlyTarget) * 100) : 0,
            totalOrders: branch.stats?.totalOrders || 0,
            avgOrderValue: branch.stats?.avgOrderValue || 0
         },
         management: {
            totalManagers: branch.managers?.length || 0,
            primaryManager: branch.managers?.find(m => m.role === 'manager') || branch.managers?.[0]
         },
         settings: {
            taxRate: branch.settings?.taxRate || 16,
            currency: branch.settings?.currency || 'PKR'
         }
      };

      res.status(200).json({
         success: true,
         data: dashboard
      });

   } catch (error) {
      console.error('Get branch dashboard error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to load dashboard'
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

      // Only super admin can restore
      if (!req.user.isSuperAdmin && req.user.companyId !== branch.companyId) {
         return res.status(403).json({
            success: false,
            message: 'Not authorized to restore this branch'
         });
      }

      // Restore branch
      branch.isDeleted = false;
      branch.deletedAt = null;
      branch.deletedBy = null;
      branch.status = 'active';
      branch.updatedBy = req.user.userId;

      branch.logAudit('branch_restored', req.user.userId, {
         restoredAt: new Date()
      });

      await branch.save();

      res.status(200).json({
         success: true,
         message: 'Branch restored successfully',
         data: branch.toJSON()
      });

   } catch (error) {
      console.error('Restore branch error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to restore branch'
      });
   }
};

export default {
   createBranch,
   getCompanyBranches,
   getBranchById,
   updateBranch,
   deleteBranch,
   addManager,
   removeManager,
   getBranchesByManager,
   findNearbyBranches,
   updateBranchStats,
   getBranchDashboard,
   restoreBranch,
};