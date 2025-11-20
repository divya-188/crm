import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Lightbulb,
  CheckCircle,
  Loader2,
  Send,
} from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import toast from '@/lib/toast';

// Import actual components
import TemplateBasicInfo from '@/components/templates/editor/TemplateBasicInfo';
import HeaderEditor from '@/components/templates/editor/HeaderEditor';
import BodyEditor from '@/components/templates/editor/BodyEditor';
import FooterEditor from '@/components/templates/editor/FooterEditor';
import ButtonEditor from '@/components/templates/editor/ButtonEditor';
import PlaceholderManager from '@/components/templates/editor/PlaceholderManager';

// Import preview component
import TemplatePreview from '@/components/templates/preview/TemplatePreview';

// Import validation panel
import ValidationPanel from '@/components/templates/validation/ValidationPanel';

// Import best practices panel
import BestPracticesPanel from '@/components/templates/best-practices/BestPracticesPanel';

// Import quality score indicator
import QualityScoreIndicator from '@/components/templates/validation/QualityScoreIndicator';

// Import submission wizard
import SubmissionWizard from '@/components/templates/submission/SubmissionWizard';

export const TemplateEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  
  const {
    isDirty,
    isSaving,
    showPreview,
    showBestPractices,
    validationErrors,
    validationWarnings,
    setShowPreview,
    setShowBestPractices,
    resetEditor,
  } = useTemplateEditorStore();

  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showSubmissionWizard, setShowSubmissionWizard] = useState(false);

  // Load template if editing
  useEffect(() => {
    if (id) {
      // TODO: Load template from API
      // const template = await templatesService.getTemplate(id);
      // loadTemplate(template);
    } else {
      resetEditor();
    }
  }, [id]);

  // Navigation guard for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle navigation with unsaved changes
  const handleNavigate = (path: string) => {
    if (isDirty) {
      setPendingNavigation(path);
      setShowUnsavedWarning(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
      setShowUnsavedWarning(false);
    }
  };

  const cancelNavigation = () => {
    setPendingNavigation(null);
    setShowUnsavedWarning(false);
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save logic
      // await templatesService.createTemplate(templateData);
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleBack = () => {
    handleNavigate('/templates');
  };

  const handleSubmitForApproval = () => {
    const state = useTemplateEditorStore.getState();
    
    // Check if template is saved
    if (!state.templateId) {
      toast.error('Please save the template before submitting for approval');
      return;
    }

    // Check for validation errors
    if (validationErrors.length > 0) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }

    // Open submission wizard
    setShowSubmissionWizard(true);
  };

  const handleSubmissionSuccess = () => {
    // Close wizard and show success message
    setShowSubmissionWizard(false);
    toast.success('Template submitted successfully! You will be notified when it is approved.');
    
    // Optionally navigate back to template list
    setTimeout(() => {
      navigate('/templates');
    }, 2000);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Templates</span>
          </Button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {id ? 'Edit Template' : 'Create New Template'}
            </h1>
            {isDirty && (
              <p className="text-sm text-gray-500">Unsaved changes</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Toggle Preview */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Hide Preview</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Show Preview</span>
              </>
            )}
          </Button>

          {/* Toggle Best Practices */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBestPractices(!showBestPractices)}
            className="flex items-center space-x-2"
          >
            <Lightbulb className="h-4 w-4" />
            <span>{showBestPractices ? 'Hide' : 'Show'} Tips</span>
          </Button>

          <div className="h-6 w-px bg-gray-300" />

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Template</span>
              </>
            )}
          </Button>

          {/* Submit for Approval Button */}
          {useTemplateEditorStore.getState().templateId && (
            <Button
              onClick={handleSubmitForApproval}
              disabled={isSaving || validationErrors.length > 0}
              variant="success"
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Submit for Approval</span>
            </Button>
          )}
        </div>
      </header>

      {/* Validation Summary */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="border-b bg-white px-6 py-3">
          {validationErrors.length > 0 && (
            <Alert 
              variant="danger" 
              className="mb-2"
              message={`${validationErrors.length} validation error${validationErrors.length !== 1 ? 's' : ''} found`}
            />
          )}
          {validationWarnings.length > 0 && (
            <Alert 
              variant="warning"
              message={`${validationWarnings.length} warning${validationWarnings.length !== 1 ? 's' : ''}`}
            />
          )}
        </div>
      )}

      {/* Main Content - Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Component Editors */}
        <motion.div
          className="flex-1 overflow-y-auto border-r bg-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <section id="component-basic">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <TemplateBasicInfo />
            </section>

            {/* Template Components */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Template Components
              </h2>
              <div className="space-y-4">
                <div id="component-header">
                  <HeaderEditor />
                </div>
                <div id="component-body">
                  <BodyEditor />
                </div>
                <div id="component-footer">
                  <FooterEditor />
                </div>
                <div id="component-buttons">
                  <ButtonEditor />
                </div>
              </div>
            </section>

            {/* Placeholder Management */}
            <section id="component-placeholders">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Placeholders & Sample Values
              </h2>
              <PlaceholderManager />
            </section>

            {/* Validation Panel - Always show if there are errors or warnings */}
            {(validationErrors.length > 0 || validationWarnings.length > 0) && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Validation Issues
                </h2>
                <ValidationPanel />
              </section>
            )}

            {/* Best Practices */}
            {showBestPractices && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Best Practices</span>
                </h2>
                <BestPracticesPanel />
              </section>
            )}
          </div>
        </motion.div>

        {/* Right Sidebar - Preview & Testing */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              className="w-[480px] overflow-y-auto bg-gray-50 border-l"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6 space-y-6">
                {/* Preview Section */}
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    WhatsApp Preview
                  </h2>
                  <TemplatePreview />
                </section>

                {/* Quality Score */}
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Quality Score
                  </h2>
                  <QualityScoreIndicator />
                </section>

                {/* Quick Tips */}
                <section className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 mb-1">
                        Preview Updates in Real-time
                      </h3>
                      <p className="text-sm text-blue-700">
                        Changes you make to the template will be reflected here instantly.
                        Use sample values to see how your template will look with actual data.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unsaved Changes Warning Modal */}
      <AnimatePresence>
        {showUnsavedWarning && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Unsaved Changes
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={cancelNavigation}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmNavigation}>
                  Leave Without Saving
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission Wizard */}
      <SubmissionWizard
        isOpen={showSubmissionWizard}
        onClose={() => setShowSubmissionWizard(false)}
        onSuccess={handleSubmissionSuccess}
      />
    </div>
  );
};

export default TemplateEditor;
