import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useState } from 'react';
import toast from '@/lib/toast';

export interface OptimisticMutationOptions<TData, TVariables, TContext = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: unknown[];
  updateFn?: (oldData: any, variables: TVariables) => any;
  successMessage?: string | ((data: TData) => string);
  errorMessage?: string | ((error: any) => string);
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  onError?: (error: any, variables: TVariables, context: TContext | undefined) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Custom hook for optimistic mutations with automatic rollback on error
 * Provides better UX by immediately updating the UI before the server responds
 */
export function useOptimisticMutation<TData = unknown, TVariables = unknown, TContext = unknown>({
  mutationFn,
  queryKey,
  updateFn,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  showSuccessToast = true,
  showErrorToast = true,
}: OptimisticMutationOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  const mutation = useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    
    // Optimistic update
    onMutate: async (variables) => {
      setIsOptimistic(true);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      if (updateFn && previousData) {
        queryClient.setQueryData(queryKey, (old: any) => updateFn(old, variables));
      }

      // Return context with the previous data
      return { previousData } as TContext;
    },

    // On success
    onSuccess: (data, variables, context) => {
      setIsOptimistic(false);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey });

      // Show success toast
      if (showSuccessToast && successMessage) {
        const message = typeof successMessage === 'function' ? successMessage(data) : successMessage;
        toast.success(message);
      }

      // Call custom onSuccess
      onSuccess?.(data, variables, context);
    },

    // On error, rollback
    onError: (error, variables, context) => {
      setIsOptimistic(false);
      
      // Rollback to previous data
      if (context && 'previousData' in context) {
        queryClient.setQueryData(queryKey, (context as any).previousData);
      }

      // Show error toast
      if (showErrorToast) {
        const message = errorMessage
          ? typeof errorMessage === 'function'
            ? errorMessage(error)
            : errorMessage
          : error.message || 'An error occurred';
        toast.error(message);
      }

      // Call custom onError
      onError?.(error, variables, context);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...mutation,
    isOptimistic,
  };
}
