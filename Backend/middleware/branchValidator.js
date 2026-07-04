// backend\middleware\branchValidator.js
import { body, param, query } from 'express-validator';

const BranchValidator = {
   // Create branch validation
   validateCreate: [
      body('companyId')
         .notEmpty()
         .withMessage('Company ID is required')
         .isString()
         .withMessage('Company ID must be a string'),

      body('branchId')
         .notEmpty()
         .withMessage('Branch ID is required')
         .isString()
         .withMessage('Branch ID must be a string')
         .isLength({ min: 3, max: 20 })
         .withMessage('Branch ID must be between 3 and 20 characters'),

      body('name')
         .notEmpty()
         .withMessage('Branch name is required')
         .isString()
         .withMessage('Branch name must be a string')
         .isLength({ min: 2, max: 100 })
         .withMessage('Branch name must be between 2 and 100 characters'),

      body('address.city')
         .notEmpty()
         .withMessage('City is required')
         .isString()
         .withMessage('City must be a string'),

      body('address.coordinates.lat')
         .optional()
         .isFloat({ min: -90, max: 90 })
         .withMessage('Latitude must be between -90 and 90'),

      body('address.coordinates.lng')
         .optional()
         .isFloat({ min: -180, max: 180 })
         .withMessage('Longitude must be between -180 and 180'),

      body('contact.phone')
         .notEmpty()
         .withMessage('Phone number is required')
         .isString()
         .withMessage('Phone must be a string'),

      body('contact.email')
         .optional()
         .isEmail()
         .withMessage('Must be a valid email'),

      body('type')
         .optional()
         .isIn(['restaurant', 'retail', 'cafe', 'warehouse'])
         .withMessage('Invalid branch type'),

      body('settings.taxRate')
         .optional()
         .isFloat({ min: 0, max: 100 })
         .withMessage('Tax rate must be between 0 and 100'),

      body('settings.currency')
         .optional()
         .isString()
         .withMessage('Currency must be a string')
         .isLength({ min: 3, max: 3 })
         .withMessage('Currency must be 3 characters'),

      body('monthlyTarget')
         .optional()
         .isFloat({ min: 0 })
         .withMessage('Monthly target must be a positive number'),

      // Manager validation for create
      body('managers')
         .optional()
         .isArray()
         .withMessage('Managers must be an array'),

      body('managers.*.userId')
         .optional()
         .isString()
         .withMessage('Manager user ID must be a string'),

      body('managers.*.role')
         .optional()
         .isIn(['manager', 'assistant', 'supervisor'])
         .withMessage('Invalid manager role')
   ],

   // Update branch validation - UPDATED to include managers
   validateUpdate: [
      param('id')
         .notEmpty()
         .withMessage('Branch ID is required'),

      body('name')
         .optional()
         .isString()
         .withMessage('Branch name must be a string')
         .isLength({ min: 2, max: 100 })
         .withMessage('Branch name must be between 2 and 100 characters'),

      body('status')
         .optional()
         .isIn(['active', 'inactive', 'closed', 'maintenance'])
         .withMessage('Invalid status'),

      body('type')
         .optional()
         .isIn(['restaurant', 'retail', 'cafe', 'warehouse'])
         .withMessage('Invalid branch type'),

      body('settings.taxRate')
         .optional()
         .isFloat({ min: 0, max: 100 })
         .withMessage('Tax rate must be between 0 and 100'),

      // Manager validation for update
      body('managers')
         .optional()
         .isArray()
         .withMessage('Managers must be an array'),

      body('managers.*.userId')
         .optional()
         .isString()
         .withMessage('Manager user ID must be a string'),

      body('managers.*.role')
         .optional()
         .isIn(['manager', 'assistant', 'supervisor'])
         .withMessage('Invalid manager role')
   ],

   // Query validation for listing
   validateQuery: [
      query('companyId')
         .optional()
         .isString()
         .withMessage('Company ID must be a string'),

      query('page')
         .optional()
         .isInt({ min: 1 })
         .withMessage('Page must be a positive integer'),

      query('limit')
         .optional()
         .isInt({ min: 1, max: 100 })
         .withMessage('Limit must be between 1 and 100'),

      query('status')
         .optional()
         .isIn(['active', 'inactive', 'closed', 'maintenance'])
         .withMessage('Invalid status'),

      query('type')
         .optional()
         .isIn(['restaurant', 'retail', 'cafe', 'warehouse'])
         .withMessage('Invalid type'),

      query('sortBy')
         .optional()
         .isIn(['name', 'createdAt', 'updatedAt', 'status'])
         .withMessage('Invalid sort field'),

      query('sortOrder')
         .optional()
         .isIn(['asc', 'desc'])
         .withMessage('Sort order must be asc or desc'),

      query('lightweight')
         .optional()
         .isBoolean()
         .withMessage('Lightweight must be a boolean')
   ],
};

export default BranchValidator;