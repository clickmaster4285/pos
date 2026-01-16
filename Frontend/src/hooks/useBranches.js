// src/hooks/useBranches.js
import {
   useCreateBranchMutation,
   useUpdateBranchMutation,
   useDeleteBranchMutation,
   useAddManagerMutation,
   useRemoveManagerMutation,
   useUpdateBranchStatsMutation,
   useLazyGetCompanyBranchesQuery,
   useLazyGetBranchByIdQuery,
   useLazyFindNearbyBranchesQuery,
   useLazyGetActiveBranchesQuery,
   useLazyGetBranchesByManagerQuery,
   useLazyValidateBranchCodeQuery,
} from '../features/branchesApi';

export const useBranchOperations = () => {
   const [createBranch, createBranchStatus] = useCreateBranchMutation();
   const [updateBranch, updateBranchStatus] = useUpdateBranchMutation();
   const [deleteBranch, deleteBranchStatus] = useDeleteBranchMutation();

   const [addManager, addManagerStatus] = useAddManagerMutation();
   const [removeManager, removeManagerStatus] = useRemoveManagerMutation();
   const [updateStats, updateStatsStatus] = useUpdateBranchStatsMutation();

   const [fetchCompanyBranches] = useLazyGetCompanyBranchesQuery();
   const [fetchBranchById] = useLazyGetBranchByIdQuery();
   const [fetchNearbyBranches] = useLazyFindNearbyBranchesQuery();
   const [fetchActiveBranches] = useLazyGetActiveBranchesQuery();
   const [fetchManagerBranches] = useLazyGetBranchesByManagerQuery();
   const [validateBranchCode] = useLazyValidateBranchCodeQuery();

   // Create branch with validation
   const createBranchWithValidation = async (branchData) => {
      try {
         // Validate branch code uniqueness
         const { data: validationData } = await validateBranchCode({
            companyId: branchData.companyId,
            branchCode: branchData.branchCode
         }).unwrap();

         if (!validationData?.isUnique) {
            throw new Error('Branch code already exists');
         }

         // Create the branch
         const result = await createBranch(branchData).unwrap();
         return result;
      } catch (error) {
         console.error('Create branch error:', error);
         throw error;
      }
   };

   // Update branch with optimistic updates
   const updateBranchOptimistic = async ({ id, ...data }) => {
      try {
         const result = await updateBranch({ id, ...data }).unwrap();
         return result;
      } catch (error) {
         console.error('Update branch error:', error);
         throw error;
      }
   };

   // Soft delete with confirmation
   const softDeleteBranch = async (id, reason = 'No reason provided') => {
      if (!window.confirm('Are you sure you want to delete this branch?')) {
         return null;
      }

      try {
         const result = await deleteBranch({ id, reason }).unwrap();
         return result;
      } catch (error) {
         console.error('Delete branch error:', error);
         throw error;
      }
   };

   // Add manager with validation
   const addBranchManager = async (branchId, userId, role = 'manager') => {
      try {
         const result = await addManager({ id: branchId, userId, role }).unwrap();
         return result;
      } catch (error) {
         console.error('Add manager error:', error);
         throw error;
      }
   };

   // Remove manager with confirmation
   const removeBranchManager = async (branchId, userId, reason = '') => {
      if (!window.confirm('Are you sure you want to remove this manager?')) {
         return null;
      }

      try {
         const result = await removeManager({ id: branchId, userId, reason }).unwrap();
         return result;
      } catch (error) {
         console.error('Remove manager error:', error);
         throw error;
      }
   };

   // Fetch company branches with error handling
   const getCompanyBranches = async (companyId, options = {}) => {
      try {
         const { data } = await fetchCompanyBranches({
            companyId,
            ...options
         }).unwrap();

         return data || { data: [], pagination: {} };
      } catch (error) {
         console.error('Fetch company branches error:', error);
         return { data: [], pagination: {}, error: error.message };
      }
   };

   // Find nearby branches with location permission
   const findNearbyBranches = async (coordinates, radius = 5) => {
      try {
         if (!coordinates?.lat || !coordinates?.lng) {
            throw new Error('Coordinates are required');
         }

         const { data } = await fetchNearbyBranches({
            lat: coordinates.lat,
            lng: coordinates.lng,
            radius
         }).unwrap();

         return data || [];
      } catch (error) {
         console.error('Find nearby branches error:', error);
         return [];
      }
   };

   // Get user's managed branches
   const getManagedBranches = async (userId) => {
      try {
         const { data } = await fetchManagerBranches(userId).unwrap();
         return data || [];
      } catch (error) {
         console.error('Get managed branches error:', error);
         return [];
      }
   };

   // Update branch statistics
   const updateBranchStatistics = async (branchId, stats) => {
      try {
         const result = await updateStats({ id: branchId, ...stats }).unwrap();
         return result;
      } catch (error) {
         console.error('Update branch statistics error:', error);
         throw error;
      }
   };

   // Get active branches for dropdown
   const getBranchesForDropdown = async (companyId) => {
      try {
         const { data } = await fetchActiveBranches(companyId).unwrap();
         return data?.data?.map(branch => ({
            value: branch.branchId,
            label: `${branch.name} (${branch.branchCode})`,
            ...branch
         })) || [];
      } catch (error) {
         console.error('Get branches dropdown error:', error);
         return [];
      }
   };

   return {
      // Mutations with status
      createBranch: createBranchWithValidation,
      updateBranch: updateBranchOptimistic,
      deleteBranch: softDeleteBranch,
      addManager: addBranchManager,
      removeManager: removeBranchManager,
      updateStats: updateBranchStatistics,

      // Queries
      getCompanyBranches,
      findNearbyBranches,
      getManagedBranches,
      getBranchesForDropdown,

      // Status indicators
      isLoading: createBranchStatus.isLoading || updateBranchStatus.isLoading,
      isCreating: createBranchStatus.isLoading,
      isUpdating: updateBranchStatus.isLoading,
      isDeleting: deleteBranchStatus.isLoading,

      // Errors
      createError: createBranchStatus.error,
      updateError: updateBranchStatus.error,
      deleteError: deleteBranchStatus.error,
   };
};