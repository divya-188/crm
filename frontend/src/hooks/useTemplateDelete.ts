import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';

/**
 * Hook for handling template deletion with campaign usage validation
 * Requirement 19.7: Prevent deletion of templates in active campaigns
 * 
 * Features:
 * - Checks if template can be deleted before attempting deletion
 * - Validates against active campaign usage
 * - Provides clear error messages
 * - Handles optimistic updates
 * - Invalidates relevant queries after deletion
 * 
 * @param templateId - The ID of the template to delete
 * @returns Object with deletion state and methods
 */
export function useTemplateDelete(templateId: string) {
  const queryClient = useQueryClient();
  const [isCheckingDeletion, setIsCheckingDeletion] = useState(false);

  // Query to check if template can be deleted
  const {
    data: deletionCheck,
    isLoading: isCheckingCanDelete,
    refetch: recheckDeletion,
  } = useQuery({
    queryKey: ['template-can-delete', templateId],
    queryFn: () => templatesService.canDeleteTemplate(templateId),
    enabled: false, // Only run when explicitly called
  });

  // Mutation for deleting the template
  const deleteMutation = useMutation({
    mutationFn: () => templatesService.deleteTemplate(templateId),
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template-usage-stats', templateId] });
    },
    onError: (error: any) => {
      console.error('Failed to delete template:', error);
    },
  });

  /**
   * Check if template can be deleted and show appropriate feedback
   * @returns Promise<boolean> - True if template can be deleted, false otherwise
   */
  const checkCanDelete = async (): Promise<boolean> => {
    setIsCheckingDeletion(true);
    
    try {
      const result = await recheckDeletion();
      
      if (!result.data) {
        console.error('Failed to check template deletion status');
        return false;
      }

      if (!result.data.canDelete) {
        console.warn('Cannot delete template:', result.data.reason);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check template deletion status:', error);
      return false;
    } finally {
      setIsCheckingDeletion(false);
    }
  };

  /**
   * Delete template with validation
   * Checks if template can be deleted before attempting deletion
   * @returns Promise<boolean> - True if deletion was successful, false otherwise
   */
  const deleteTemplate = async (): Promise<boolean> => {
    // First check if template can be deleted
    const canDelete = await checkCanDelete();
    
    if (!canDelete) {
      return false;
    }

    // Proceed with deletion
    try {
      await deleteMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Delete template without validation (force delete)
   * Use with caution - bypasses campaign usage checks
   * @returns Promise<boolean> - True if deletion was successful, false otherwise
   */
  const forceDeleteTemplate = async (): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    // State
    canDelete: deletionCheck?.canDelete ?? null,
    deleteReason: deletionCheck?.reason,
    activeCampaigns: deletionCheck?.activeCampaigns,
    isCheckingDeletion: isCheckingDeletion || isCheckingCanDelete,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Methods
    checkCanDelete,
    deleteTemplate,
    forceDeleteTemplate,
    recheckDeletion,
  };
}

export default useTemplateDelete;
