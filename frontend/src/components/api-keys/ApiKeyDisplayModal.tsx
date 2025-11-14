import { useState } from 'react';
import { Copy, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { ApiKeyWithPlainKey } from '@/types/models.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import toast from '@/lib/toast';

interface ApiKeyDisplayModalProps {
  apiKey: ApiKeyWithPlainKey;
  onClose: () => void;
}

export function ApiKeyDisplayModal({ apiKey, onClose }: ApiKeyDisplayModalProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const maskedKey = apiKey.key.substring(0, 8) + '•'.repeat(apiKey.key.length - 8);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="API Key Created Successfully"
      size="md"
    >
      <div className="space-y-6">
        {/* Warning Alert */}
        <Alert 
          variant="warning"
          title="Save this API key securely"
          message="This is the only time you'll see the full API key. Make sure to copy it now and store it securely."
          icon={<AlertTriangle className="w-5 h-5" />}
        />

        {/* API Key Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key Name
            </label>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-mono text-gray-900 dark:text-white">
                {apiKey.name}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Key
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {showKey ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    Show
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg pr-12">
                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                  {showKey ? apiKey.key : maskedKey}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate Limit
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-900 dark:text-white">
                  {apiKey.rateLimit} requests / {apiKey.rateLimitWindow}s
                </p>
              </div>
            </div>

            {apiKey.expiresAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expires At
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(apiKey.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            How to use this API key
          </h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>Include the API key in your requests using one of these methods:</p>
            <div className="space-y-1 font-mono text-xs bg-blue-100 dark:bg-blue-900/40 p-3 rounded">
              <p>Authorization: Bearer {apiKey.keyPrefix}...</p>
              <p className="text-gray-500 dark:text-gray-400">or</p>
              <p>X-API-Key: {apiKey.keyPrefix}...</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleCopy} variant="secondary">
            <Copy className="w-4 h-4 mr-2" />
            Copy Key
          </Button>
          <Button onClick={onClose}>
            I've Saved the Key
          </Button>
        </div>
      </div>
    </Modal>
  );
}
