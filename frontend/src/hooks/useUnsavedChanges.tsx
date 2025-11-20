import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateEditorStore } from '@/stores/template-editor.store';

interface UseUnsavedChangesOptions {
  when: boolean;
  message?: string;
  onNavigate?: () => void;
}

interface UseUnsavedChangesReturn {
  showWarning: boolean;
  pendingPath: string | null;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  attemptNavigation: (path: string) => void;
}

/**
 * Hook to handle unsaved changes and navigation guards
 * Prevents navigation when there are unsaved changes
 */
export const useUnsavedChanges = ({
  when,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  onNavigate,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // Prevent browser navigation (refresh, close tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (when) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [when, message]);

  // Attempt to navigate to a new path
  const attemptNavigation = useCallback(
    (path: string) => {
      if (when) {
        setPendingPath(path);
        setShowWarning(true);
      } else {
        navigate(path);
        onNavigate?.();
      }
    },
    [when, navigate, onNavigate]
  );

  // Confirm navigation and discard changes
  const confirmNavigation = useCallback(() => {
    if (pendingPath) {
      setShowWarning(false);
      navigate(pendingPath);
      setPendingPath(null);
      onNavigate?.();
    }
  }, [pendingPath, navigate, onNavigate]);

  // Cancel navigation and stay on current page
  const cancelNavigation = useCallback(() => {
    setShowWarning(false);
    setPendingPath(null);
  }, []);

  return {
    showWarning,
    pendingPath,
    confirmNavigation,
    cancelNavigation,
    attemptNavigation,
  };
};

/**
 * Hook specifically for template editor unsaved changes
 */
export const useTemplateEditorUnsavedChanges = () => {
  const { isDirty, resetEditor } = useTemplateEditorStore();

  return useUnsavedChanges({
    when: isDirty,
    message: 'You have unsaved changes to this template. Are you sure you want to leave?',
    onNavigate: () => {
      // Reset editor state when navigating away
      resetEditor();
    },
  });
};

interface UnsavedChangesWarningProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

/**
 * Component to show unsaved changes warning modal
 */
export const UnsavedChangesWarning = ({
  show,
  onConfirm,
  onCancel,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
}: UnsavedChangesWarningProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Leave Without Saving
          </button>
        </div>
      </div>
    </div>
  );
};

export default useUnsavedChanges;
