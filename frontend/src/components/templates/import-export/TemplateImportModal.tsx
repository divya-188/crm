import React, { useState, useRef } from 'react';
import { X, Upload, FileJson, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import Toast from '@/lib/toast-system';
import TemplateImportPreview from './TemplateImportPreview';

interface TemplateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportPreview {
  totalTemplates: number;
  validTemplates: number;
  invalidTemplates: number;
  duplicates: number;
  templates: Array<{
    name: string;
    displayName?: string;
    category: string;
    language: string;
    status: 'valid' | 'invalid' | 'duplicate';
    errors?: string[];
    warnings?: string[];
  }>;
}

const TemplateImportModal: React.FC<TemplateImportModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [createVersions, setCreateVersions] = useState(false);
  const [namePrefix, setNamePrefix] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: (data: { file: File; skipDuplicates: boolean; namePrefix?: string }) =>
      templatesService.previewImport(data),
    onSuccess: (data) => {
      setPreview(data);
      setStep('preview');
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to preview import');
    },
  });

  const importMutation = useMutation({
    mutationFn: (data: {
      file: File;
      skipDuplicates: boolean;
      createVersions: boolean;
      namePrefix?: string;
    }) => templatesService.importTemplates(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      
      const successMessage = `Successfully imported ${data.imported} template(s)`;
      const details = [];
      
      if (data.skipped > 0) {
        details.push(`${data.skipped} skipped (duplicates)`);
      }
      if (data.failed > 0) {
        details.push(`${data.failed} failed`);
      }
      
      Toast.success(
        details.length > 0 
          ? `${successMessage}. ${details.join(', ')}.`
          : successMessage
      );
      
      if (data.errors.length > 0) {
        console.error('Import errors:', data.errors);
      }
      
      handleClose();
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to import templates');
      setStep('preview');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        Toast.error('Please select a valid JSON file');
        return;
      }
      setSelectedFile(file);
      setPreview(null);
      setStep('upload');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        Toast.error('Please select a valid JSON file');
        return;
      }
      setSelectedFile(file);
      setPreview(null);
      setStep('upload');
    }
  };

  const handlePreview = () => {
    if (!selectedFile) {
      Toast.error('Please select a file first');
      return;
    }

    previewMutation.mutate({
      file: selectedFile,
      skipDuplicates,
      namePrefix: namePrefix.trim() || undefined,
    });
  };

  const handleImport = () => {
    if (!selectedFile) {
      Toast.error('Please select a file first');
      return;
    }

    setStep('importing');
    importMutation.mutate({
      file: selectedFile,
      skipDuplicates,
      createVersions,
      namePrefix: namePrefix.trim() || undefined,
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setStep('upload');
    setSkipDuplicates(true);
    setCreateVersions(false);
    setNamePrefix('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import Templates</h2>
            <p className="text-sm text-gray-500 mt-1">
              Import templates from a JSON file
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={step === 'importing'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Upload className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Click to upload
                      </button>
                      <span className="text-sm text-gray-500"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-500">JSON files only</p>
                  </div>
                )}
              </div>

              {/* Import Options */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Import Options</h3>
                
                <div className="space-y-3">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">
                        Skip duplicate templates
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Templates with names that already exist will be skipped
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={createVersions}
                      onChange={(e) => setCreateVersions(e.target.checked)}
                      disabled={skipDuplicates}
                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">
                        Create new versions for existing templates
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        If a template already exists, create a new version instead of skipping
                      </p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name prefix (optional)
                    </label>
                    <input
                      type="text"
                      value={namePrefix}
                      onChange={(e) => setNamePrefix(e.target.value)}
                      placeholder="e.g., imported_"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add a prefix to all imported template names
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900">Import Guidelines</h4>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                      <li>Templates will be validated before import</li>
                      <li>Invalid templates will be skipped with error details</li>
                      <li>All imported templates will start in DRAFT status</li>
                      <li>You can preview the import before confirming</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <TemplateImportPreview
              preview={preview}
              onBack={() => setStep('upload')}
            />
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm text-gray-600">Importing templates...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            disabled={step === 'importing'}
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            {step === 'upload' && (
              <button
                onClick={handlePreview}
                disabled={!selectedFile || previewMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {previewMutation.isPending ? 'Validating...' : 'Preview Import'}
              </button>
            )}
            
            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={preview.validTemplates === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Import {preview.validTemplates} Template{preview.validTemplates !== 1 ? 's' : ''}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateImportModal;
