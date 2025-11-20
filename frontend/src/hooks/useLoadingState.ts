import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

/**
 * Custom hook for managing loading states with messages
 * Useful for showing loading overlays during async operations
 */
export function useLoadingState(initialMessage = 'Loading...') {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: initialMessage,
  });

  const startLoading = useCallback((message?: string) => {
    setLoadingState({
      isLoading: true,
      message: message || initialMessage,
    });
  }, [initialMessage]);

  const stopLoading = useCallback(() => {
    setLoadingState((prev) => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState((prev) => ({
      ...prev,
      message,
    }));
  }, []);

  const withLoading = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      message?: string
    ): Promise<T> => {
      startLoading(message);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    updateMessage,
    withLoading,
  };
}
