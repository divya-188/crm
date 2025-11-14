import { useState } from 'react';
import { Book, Code, Copy, Check, ExternalLink } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from '@/lib/toast';

interface ApiDocsModalProps {
  onClose: () => void;
}

const API_ENDPOINTS = [
  {
    category: 'Contacts',
    endpoints: [
      {
        method: 'GET',
        path: '/public/v1/contacts',
        description: 'List all contacts',
        params: 'page, limit, search',
      },
      {
        method: 'GET',
        path: '/public/v1/contacts/:id',
        description: 'Get contact details',
      },
      {
        method: 'POST',
        path: '/public/v1/contacts',
        description: 'Create a new contact',
      },
    ],
  },
  {
    category: 'Messages',
    endpoints: [
      {
        method: 'POST',
        path: '/public/v1/messages/send',
        description: 'Send a message',
      },
      {
        method: 'GET',
        path: '/public/v1/messages/:id/status',
        description: 'Get message delivery status',
      },
    ],
  },
  {
    category: 'Conversations',
    endpoints: [
      {
        method: 'GET',
        path: '/public/v1/conversations',
        description: 'List conversations',
        params: 'page, limit, status',
      },
      {
        method: 'GET',
        path: '/public/v1/conversations/:id',
        description: 'Get conversation details',
      },
      {
        method: 'GET',
        path: '/public/v1/conversations/:id/messages',
        description: 'Get conversation messages',
      },
    ],
  },
  {
    category: 'Templates',
    endpoints: [
      {
        method: 'GET',
        path: '/public/v1/templates',
        description: 'List templates',
      },
      {
        method: 'GET',
        path: '/public/v1/templates/:id',
        description: 'Get template details',
      },
      {
        method: 'POST',
        path: '/public/v1/templates/:id/send',
        description: 'Send template message',
      },
    ],
  },
  {
    category: 'Campaigns',
    endpoints: [
      {
        method: 'GET',
        path: '/public/v1/campaigns',
        description: 'List campaigns',
      },
      {
        method: 'GET',
        path: '/public/v1/campaigns/:id',
        description: 'Get campaign details',
      },
      {
        method: 'GET',
        path: '/public/v1/campaigns/:id/stats',
        description: 'Get campaign statistics',
      },
    ],
  },
];

const CODE_EXAMPLES = {
  curl: `curl -X POST http://localhost:3000/api/v1/public/v1/messages/send \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hello from API!",
    "type": "text"
  }'`,
  javascript: `const axios = require('axios');

const apiKey = 'your-api-key';
const baseURL = 'http://localhost:3000/api/v1/public/v1';

const client = axios.create({
  baseURL,
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }
});

// Send a message
async function sendMessage(phoneNumber, message) {
  const response = await client.post('/messages/send', {
    phoneNumber,
    message,
    type: 'text'
  });
  return response.data;
}

sendMessage('+1234567890', 'Hello!');`,
  python: `import requests

API_KEY = 'your-api-key'
BASE_URL = 'http://localhost:3000/api/v1/public/v1'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Send a message
def send_message(phone_number, message):
    response = requests.post(
        f'{BASE_URL}/messages/send',
        headers=headers,
        json={
            'phoneNumber': phone_number,
            'message': message,
            'type': 'text'
        }
    )
    return response.json()

result = send_message('+1234567890', 'Hello!')
print(result)`,
};

export function ApiDocsModal({ onClose }: ApiDocsModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof CODE_EXAMPLES>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(CODE_EXAMPLES[selectedLanguage]);
      setCopiedCode(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'POST':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'PATCH':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="API Documentation"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Public REST API
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Integrate with your applications using our REST API
              </p>
            </div>
          </div>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Full Documentation
          </a>
        </div>

        {/* Authentication */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Authentication
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            Include your API key in requests using one of these headers:
          </p>
          <div className="space-y-1 font-mono text-xs bg-blue-100 dark:bg-blue-900/40 p-3 rounded">
            <p className="text-blue-900 dark:text-blue-100">X-API-Key: your-api-key</p>
            <p className="text-gray-500 dark:text-gray-400">or</p>
            <p className="text-blue-900 dark:text-blue-100">Authorization: Bearer your-api-key</p>
          </div>
        </div>

        {/* Endpoints */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Available Endpoints
          </h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {API_ENDPOINTS.map((category) => (
              <div key={category.category}>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {category.category}
                </h5>
                <div className="space-y-2">
                  {category.endpoints.map((endpoint, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(
                          endpoint.method
                        )}`}
                      >
                        {endpoint.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-gray-900 dark:text-white truncate">
                          {endpoint.path}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {endpoint.description}
                        </p>
                        {endpoint.params && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Params: {endpoint.params}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Examples */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Code Examples
            </h4>
            <div className="flex gap-2">
              {Object.keys(CODE_EXAMPLES).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang as keyof typeof CODE_EXAMPLES)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
              <code>{CODE_EXAMPLES[selectedLanguage]}</code>
            </pre>
            <button
              onClick={handleCopyCode}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Copy code"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Rate Limiting Info */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            Rate Limiting
          </h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Each API key has configurable rate limits. When exceeded, you'll receive a 429 (Too Many Requests) response.
            Check the <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 rounded">X-RateLimit-*</code> headers
            in responses for limit information.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
