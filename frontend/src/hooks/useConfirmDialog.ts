import { useState, useCallback } from 'react';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  onConfirm: () => void | Promise<void>;
}

/**
 * Custom hook for managing confirmation dialogs
 * Provides a simple API for showing confirmation dialogs before destructive actions
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = useCallback(
    (options: Omit<ConfirmDialogState, 'isOpen'>) => {
      setDialogState({
        ...options,
        isOpen: true,
      });
    },
    []
  );

  const hideConfirm = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    await dialogState.onConfirm();
    hideConfirm();
  }, [dialogState.onConfirm, hideConfirm]);

  return {
    dialogState,
    showConfirm,
    hideConfirm,
    handleConfirm,
  };
}
