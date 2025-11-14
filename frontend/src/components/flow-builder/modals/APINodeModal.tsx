import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import VariablePicker from '../VariablePicker';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface APINodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: APINodeData) => void;
  initialData?: APINodeData;
}

export interface APINodeData {
  label?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Array<{ key: string; value: string }>;
  body?: string;
  responseVariable?: string;
  timeout?: number;
}

const APINodeModal: React.FC<APINodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [label, setLabel] = useState(initialData?.label || 'API Request');
  const [method, setMethod] = useState<APINodeData['method']>(initialData?.method || 'GET');
  const [url, setUrl] = useState(initialData?.url || '');
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    initialData?.headers || []
  );
  const [body, setBody] = useState(initialData?.body || '');
  const [responseVariable, setResponseVariable] = useState(initialData?.responseVariable || '');
  const [timeout, setTimeout] = useState(initialData?.timeout?.toString() || '30');

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || 'API Request');
      setMethod(initialData.method || 'GET');
      setUrl(initialData.url || '');
      setHeaders(initialData.headers || []);
      setBody(initialData.body || '');
      setResponseVariable(initialData.responseVariable || '');
      setTimeout(initialData.timeout?.toString() || '30');
    }
  }, [initialData]);

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const handleSave = () => {
    if (!url.trim()) {
      return;
    }

    // Filter out empty headers
    const validHeaders = headers.filter((h) => h.key.trim() && h.value.trim());

    onSave({
      label: label.trim() || 'API Request',
      method,
      url: url.trim(),
      headers: validHeaders.length > 0 ? validHeaders : undefined,
      body: body.trim() || undefined,
      responseVariable: responseVariable.trim() || undefined,
      timeout: parseInt(timeout) || 30,
    });
    onClose();
  };

  const handleCancel = () => {
    setLabel(initialData?.label || 'API Request');
    setMethod(initialData?.method || 'GET');
    setUrl(initialData?.url || '');
    setHeaders(initialData?.headers || []);
    setBody(initialData?.body || '');
    setResponseVariable(initialData?.responseVariable || '');
    setTimeout(initialData?.timeout?.toString() || '30');
    onClose();
  };

  const isValid = url.trim().length > 0;
  const supportsBody = ['POST', 'PUT', 'PATCH'].includes(method);

  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET':
        return 'bg-success-100 text-success-700 border-success-300';
      case 'POST':
        return 'bg-primary-100 text-primary-700 border-primary-300';
      case 'PUT':
        return 'bg-accent-100 text-accent-700 border-accent-300';
      case 'DELETE':
        return 'bg-danger-100 text-danger-700 border-danger-300';
      case 'PATCH':
        return 'bg-secondary-100 text-secondary-700 border-secondary-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Configure API Node"
      description="Make HTTP requests to external APIs and use the response in your flow"
      size="xl"
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
            placeholder="e.g., Fetch User Data"
          />
        </div>

        {/* Method and URL */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Method *
            </label>
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value as APINodeData['method'])}
              className="font-semibold"
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'PATCH', label: 'PATCH' },
                { value: 'DELETE', label: 'DELETE' },
              ]}
            />
          </div>
          <div className="col-span-3">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              URL *
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Headers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-neutral-700">
              Headers (Optional)
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddHeader}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Header
            </Button>
          </div>

          {headers.length > 0 && (
            <div className="space-y-2">
              <AnimatePresence>
                {headers.map((header, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={header.key}
                      onChange={(e) =>
                        handleHeaderChange(index, 'key', e.target.value)
                      }
                      placeholder="Header name"
                      className="flex-1 font-mono text-sm"
                    />
                    <Input
                      value={header.value}
                      onChange={(e) =>
                        handleHeaderChange(index, 'value', e.target.value)
                      }
                      placeholder="Header value"
                      className="flex-1 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove header"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {headers.length === 0 && (
            <div className="text-sm text-neutral-500 text-center py-4 border border-dashed border-neutral-300 rounded-lg">
              No headers added. Click "Add Header" to include custom headers.
            </div>
          )}
        </div>

        {/* Request Body */}
        {supportsBody && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                Request Body (JSON)
              </label>
              <VariablePicker
                onSelect={(variable) => setBody(body + variable)}
                placeholder="Insert variable"
              />
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              rows={6}
              className="font-mono text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Enter JSON data to send in the request body. You can use variables.
            </p>
          </div>
        )}

        {/* Response Variable */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Save Response As (Optional)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-mono text-sm">{'{{'}</span>
            <Input
              value={responseVariable}
              onChange={(e) => setResponseVariable(e.target.value)}
              placeholder="api_response"
              className="flex-1 font-mono"
            />
            <span className="text-neutral-500 font-mono text-sm">{'}}'}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Store the API response in a variable to use later in the flow
          </p>
        </div>

        {/* Timeout */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Timeout (seconds)
          </label>
          <Input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
            placeholder="30"
            min="1"
            max="300"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Maximum time to wait for the API response (1-300 seconds)
          </p>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Preview
          </label>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <Zap className="w-5 h-5 text-success-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="font-medium text-neutral-900">
                  {label || 'API Request'}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded border ${getMethodColor(
                      method
                    )}`}
                  >
                    {method}
                  </span>
                  <code className="text-xs text-neutral-600 font-mono truncate">
                    {url || 'https://api.example.com/endpoint'}
                  </code>
                </div>
                {headers.length > 0 && (
                  <div className="text-xs text-neutral-600">
                    {headers.length} custom header{headers.length !== 1 ? 's' : ''}
                  </div>
                )}
                {responseVariable && (
                  <div className="text-xs text-neutral-600">
                    Response → <code className="px-2 py-1 bg-success-100 text-success-700 rounded font-mono">
                      {`{{${responseVariable}}}`}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-success-900 mb-2">
            💡 Tips
          </h4>
          <ul className="text-sm text-success-800 space-y-1">
            <li>• Use variables in the URL, headers, or body for dynamic requests</li>
            <li>• Save the response to access data in subsequent nodes</li>
            <li>• Add authentication headers (e.g., Authorization) as needed</li>
            <li>• Set appropriate timeouts based on expected response time</li>
            <li>• Test your API endpoint before using it in production</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default APINodeModal;
