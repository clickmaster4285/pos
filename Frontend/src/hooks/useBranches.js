// src/hooks/useBranches.js
import {
   useCreateBranchMutation,
   useUpdateBranchMutation,
   useDeleteBranchMutation,
   useLazyGetBranchesQuery,
   useLazyGetBranchByIdQuery,
   useLazyGetActiveBranchesQuery,
   useLazyValidateBranchCodeQuery,
} from '../features/branchesApi';

export const useBranchOperations = () => {
   const [createBranch, createBranchStatus] = useCreateBranchMutation();
   const [updateBranch, updateBranchStatus] = useUpdateBranchMutation();
   const [deleteBranch, deleteBranchStatus] = useDeleteBranchMutation();

   const [fetchBranches] = useLazyGetBranchesQuery();
   const [fetchBranchById] = useLazyGetBranchByIdQuery();
   const [fetchActiveBranches] = useLazyGetActiveBranchesQuery();
   const [validateBranchCode] = useLazyValidateBranchCodeQuery();

   // Create branch with validation
   const createBranchWithValidation = async (branchData) => {
      try {
         // Validate branch code uniqueness
         const { data: validationData } = await validateBranchCode({
            companyId: branchData.companyId,
            branchCode: branchData.branchId // Changed from branchCode to branchId
         }).unwrap();

         if (!validationData?.isUnique) {
            throw new Error('Branch ID already exists');
         }

         // Create the branch
         const result = await createBranch(branchData).unwrap();
         return result;
      } catch (error) {
         console.error('Create branch error:', error);
         throw error;
      }
   };

   // Update branch
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

   // Fetch branches with error handling
   const getBranches = async (filters = {}) => {
      try {
         const { data } = await fetchBranches(filters).unwrap();
         return data || { data: [], pagination: {} };
      } catch (error) {
         console.error('Fetch branches error:', error);
         return { data: [], pagination: {}, error: error.message };
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

   // Restore branch
   const restoreDeletedBranch = async (id) => {
      try {
         const result = await BranchController.restoreBranch(id);
         return result;
      } catch (error) {
         console.error('Restore branch error:', error);
         throw error;
      }
   };

   return {
      // Mutations
      createBranch: createBranchWithValidation,
      updateBranch: updateBranchOptimistic,
      deleteBranch: softDeleteBranch,
      restoreBranch: restoreDeletedBranch,

      // Queries
      getBranches,
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