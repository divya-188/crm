import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
import { Template } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

export function TemplatePreviewModal({ isOpen, onClose, template }: TemplatePreviewModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    if (template) {
      // Initialize variable values with examples
      const initialValues: Record<string, string> = {};
      template.variables?.forEach((variable) => {
        initialValues[variable.name] = variable.example;
      });
      setVariableValues(initialValues);
    }
  }, [template]);

  useEffect(() => {
    if (template) {
      generatePreview();
    }
  }, [template, variableValues]);

  const generatePreview = () => {
    if (!template) return;

    let content = template.content;

    // Replace variables with values
    template.variables?.forEach((variable, index) => {
      const value = variableValues[variable.name] || variable.example;
      content = content.replace(`{{${index + 1}}}`, value);
    });

    setPreviewContent(content);
  };

  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Template Preview</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Variable Inputs */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Variable Values</h3>
            {template.variables && template.variables.length > 0 ? (
              <div className="space-y-3">
                {template.variables.map((variable, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable.name} {`{{${index + 1}}}`}
                    </label>
                    <Input
                      value={variableValues[variable.name] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setVariableValues({
                          ...variableValues,
                          [variable.name]: e.target.value,
                        })
                      }
                      placeholder={variable.example}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No variables in this template</p>
            )}

            {/* Template Info */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-900">{template.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Language:</span>
                <span className="font-medium text-gray-900">{template.language}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-gray-900">{template.status}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              WhatsApp Preview
            </h3>
            <div className="bg-[#e5ddd5] rounded-lg p-4 min-h-[400px]">
              <div className="bg-white rounded-lg shadow-sm p-3 space-y-2">
                {/* Header */}
                {template.header && (
                  <div className="font-semibold text-gray-900 pb-2 border-b">
                    {template.header}
                  </div>
                )}

                {/* Content */}
                <div className="text-gray-800 whitespace-pre-wrap break-words">
                  {previewContent}
                </div>

                {/* Footer */}
                {template.footer && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {template.footer}
                  </div>
                )}

                {/* Buttons */}
                {template.buttons && template.buttons.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    {template.buttons.map((button, index) => (
                      <button
                        key={index}
                        className="w-full py-2 text-center text-blue-600 hover:bg-gray-50 rounded font-medium text-sm"
                      >
                        {button.type === 'url' && '🔗 '}
                        {button.type === 'phone' && '📞 '}
                        {button.text}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-gray-400 text-right pt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
