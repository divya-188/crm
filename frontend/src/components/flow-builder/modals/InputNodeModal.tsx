import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import VariablePicker from '../VariablePicker';
import { Keyboard } from 'lucide-react';

interface InputNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InputNodeData) => void;
  initialData?: InputNodeData;
}

export interface InputNodeData {
  label?: string;
  prompt: string;
  variableName: string;
  inputType: 'text' | 'number' | 'email' | 'phone' | 'any';
  validation?: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  errorMessage?: string;
}

const InputNodeModal: React.FC<InputNodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [label, setLabel] = useState(initialData?.label || 'Get User Input');
  const [prompt, setPrompt] = useState(initialData?.prompt || '');
  const [variableName, setVariableName] = useState(initialData?.variableName || '');
  const [inputType, setInputType] = useState<InputNodeData['inputType']>(
    initialData?.inputType || 'text'
  );
  const [required, setRequired] = useState(initialData?.validation?.required ?? true);
  const [minLength, setMinLength] = useState(initialData?.validation?.minLength?.toString() || '');
  const [maxLength, setMaxLength] = useState(initialData?.validation?.maxLength?.toString() || '');
  const [errorMessage, setErrorMessage] = useState(initialData?.errorMessage || '');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || 'Get User Input');
      setPrompt(initialData.prompt || '');
      setVariableName(initialData.variableName || '');
      setInputType(initialData.inputType || 'text');
      setRequired(initialData.validation?.required ?? true);
      setMinLength(initialData.validation?.minLength?.toString() || '');
      setMaxLength(initialData.validation?.maxLength?.toString() || '');
      setErrorMessage(initialData.errorMessage || '');
    }
  }, [initialData]);

  const handleVariableSelect = (variable: string) => {
    const newPrompt =
      prompt.slice(0, cursorPosition) +
      variable +
      prompt.slice(cursorPosition);
    setPrompt(newPrompt);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = cursorPosition + variable.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSave = () => {
    if (!prompt.trim() || !variableName.trim()) {
      return;
    }

    // Clean variable name (remove spaces, special chars)
    const cleanVariableName = variableName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    const validation: InputNodeData['validation'] = {
      required,
      ...(minLength && { minLength: parseInt(minLength) }),
      ...(maxLength && { maxLength: parseInt(maxLength) }),
    };

    onSave({
      label: label.trim() || 'Get User Input',
      prompt: prompt.trim(),
      variableName: cleanVariableName,
      inputType,
      validation,
      errorMessage: errorMessage.trim() || undefined,
    });
    onClose();
  };

  const handleCancel = () => {
    setLabel(initialData?.label || 'Get User Input');
    setPrompt(initialData?.prompt || '');
    setVariableName(initialData?.variableName || '');
    setInputType(initialData?.inputType || 'text');
    setRequired(initialData?.validation?.required ?? true);
    setMinLength(initialData?.validation?.minLength?.toString() || '');
    setMaxLength(initialData?.validation?.maxLength?.toString() || '');
    setErrorMessage(initialData?.errorMessage || '');
    onClose();
  };

  const isValid = prompt.trim().length > 0 && variableName.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Configure Input Node"
      description="Capture user input and save it to a variable"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!isValid}>
            Save Configuration
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Node Label */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Node Label
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Get Customer Name"
          />
        </div>

        {/* Prompt Message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-neutral-700">
              Prompt Message *
            </label>
            <VariablePicker
              onSelect={handleVariableSelect}
              placeholder="Insert variable"
            />
          </div>
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setCursorPosition(e.target.selectionStart);
            }}
            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            placeholder="What message should we send to ask for input?"
            rows={4}
          />
          <p className="mt-1 text-xs text-neutral-500">
            This message will be sent to the user before waiting for their response
          </p>
        </div>

        {/* Variable Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Save Response As *
          </label>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-mono text-sm">{'{{'}</span>
            <Input
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
              placeholder="variable_name"
              className="flex-1 font-mono"
            />
            <span className="text-neutral-500 font-mono text-sm">{'}}'}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Use lowercase letters, numbers, and underscores only
          </p>
        </div>

        {/* Input Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Expected Input Type
          </label>
          <Select
            value={inputType}
            onChange={(e) => setInputType(e.target.value as InputNodeData['inputType'])}
            options={[
              { value: 'any', label: 'Any Text' },
              { value: 'text', label: 'Text Only' },
              { value: 'number', label: 'Number' },
              { value: 'email', label: 'Email Address' },
              { value: 'phone', label: 'Phone Number' },
            ]}
          />
          <p className="mt-1 text-xs text-neutral-500">
            The system will validate the user&apos;s response matches this type
          </p>
        </div>

        {/* Validation Options */}
        <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-semibold text-neutral-900">
            Validation Rules
          </h4>

          {/* Required */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">
              Response is required (user must provide input)
            </span>
          </label>

          {/* Min/Max Length */}
          {(inputType === 'text' || inputType === 'any') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Minimum Length
                </label>
                <Input
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                  placeholder="No minimum"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Maximum Length
                </label>
                <Input
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                  placeholder="No maximum"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Custom Error Message (Optional)
          </label>
          <Input
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="e.g., Please enter a valid email address"
          />
          <p className="mt-1 text-xs text-neutral-500">
            This message will be shown if validation fails
          </p>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Preview
          </label>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent-100 rounded-lg">
                <Keyboard className="w-5 h-5 text-accent-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-neutral-200">
                  {prompt || (
                    <span className="text-neutral-400 italic">
                      Your prompt will appear here...
                    </span>
                  )}
                </div>
                {variableName && (
                  <div className="text-xs text-neutral-600">
                    Response saved as:{' '}
                    <code className="px-2 py-1 bg-accent-100 text-accent-700 rounded font-mono">
                      {`{{${variableName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}}}`}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-accent-900 mb-2">
            💡 Tips
          </h4>
          <ul className="text-sm text-accent-800 space-y-1">
            <li>• Be clear about what information you're requesting</li>
            <li>• Use descriptive variable names for easy reference later</li>
            <li>• Set appropriate validation to ensure data quality</li>
            <li>• Provide helpful error messages for better UX</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default InputNodeModal;
