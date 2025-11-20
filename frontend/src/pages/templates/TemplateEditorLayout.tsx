import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, Tablet } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TemplateEditorLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  showRightPanel: boolean;
}

/**
 * Responsive layout wrapper for template editor
 * Handles different screen sizes and view modes
 */
export const TemplateEditorLayout: React.FC<TemplateEditorLayoutProps> = ({
  leftPanel,
  rightPanel,
  showRightPanel,
}) => {
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Detect screen size
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  const isMediumScreen = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Mobile view (< 768px) - Stack vertically with tabs
  if (isSmallScreen) {
    return (
      <div className="flex h-full flex-col">
        {/* Mobile Tab Switcher */}
        <div className="flex border-b bg-white">
          <button
            onClick={() => setMobileView('editor')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mobileView === 'editor'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mobileView === 'preview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {mobileView === 'editor' ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {leftPanel}
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {rightPanel}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Tablet view (768px - 1024px) - Collapsible sidebar
  if (isMediumScreen) {
    return (
      <div className="flex h-full">
        {/* Left Panel - Always visible */}
        <div className="flex-1 overflow-y-auto border-r bg-white">
          {leftPanel}
        </div>

        {/* Right Panel - Collapsible */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-y-auto bg-gray-50"
            >
              {rightPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop view (> 1024px) - Side by side
  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="flex-1 overflow-y-auto border-r bg-white">
        {leftPanel}
      </div>

      {/* Right Panel */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-[480px] overflow-y-auto bg-gray-50 border-l"
          >
            {rightPanel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type ViewMode = 'desktop' | 'tablet' | 'mobile';

/**
 * Device preview mode selector
 * Allows switching between desktop, tablet, and mobile preview modes
 */
export const DevicePreviewSelector: React.FC<{
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center space-x-2 rounded-lg bg-gray-100 p-1">
      <Button
        variant={mode === 'desktop' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('desktop')}
        className="flex items-center space-x-2"
      >
        <Monitor className="h-4 w-4" />
        <span className="hidden sm:inline">Desktop</span>
      </Button>
      
      <Button
        variant={mode === 'tablet' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('tablet')}
        className="flex items-center space-x-2"
      >
        <Tablet className="h-4 w-4" />
        <span className="hidden sm:inline">Tablet</span>
      </Button>
      
      <Button
        variant={mode === 'mobile' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('mobile')}
        className="flex items-center space-x-2"
      >
        <Smartphone className="h-4 w-4" />
        <span className="hidden sm:inline">Mobile</span>
      </Button>
    </div>
  );
};

export default TemplateEditorLayout;
