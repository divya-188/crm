import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, Clock } from 'lucide-react';

interface SavedResponsesDropdownProps {
  onSelect: (response: string) => void;
  onClose: () => void;
}

// Mock saved responses - in real app, fetch from API
const SAVED_RESPONSES = [
  {
    id: '1',
    shortcut: '/hello',
    text: 'Hello! Thank you for contacting us. How can I help you today?',
    category: 'Greetings',
    usageCount: 45,
  },
  {
    id: '2',
    shortcut: '/thanks',
    text: 'Thank you for your message. We appreciate your patience!',
    category: 'Greetings',
    usageCount: 32,
  },
  {
    id: '3',
    shortcut: '/hours',
    text: 'Our business hours are Monday to Friday, 9 AM to 6 PM. We will respond to your message during these hours.',
    category: 'Information',
    usageCount: 28,
  },
  {
    id: '4',
    shortcut: '/shipping',
    text: 'Your order will be shipped within 2-3 business days. You will receive a tracking number once it ships.',
    category: 'Orders',
    usageCount: 21,
  },
  {
    id: '5',
    shortcut: '/refund',
    text: 'We process refunds within 5-7 business days. The amount will be credited to your original payment method.',
    category: 'Orders',
    usageCount: 18,
  },
  {
    id: '6',
    shortcut: '/support',
    text: 'I will escalate this to our support team. They will get back to you within 24 hours.',
    category: 'Support',
    usageCount: 15,
  },
  {
    id: '7',
    shortcut: '/followup',
    text: 'I will follow up with you on this matter. Is there anything else I can help you with?',
    category: 'Support',
    usageCount: 12,
  },
  {
    id: '8',
    shortcut: '/bye',
    text: 'Thank you for contacting us! Have a great day! 😊',
    category: 'Greetings',
    usageCount: 40,
  },
];

export const SavedResponsesDropdown: React.FC<SavedResponsesDropdownProps> = ({
  onSelect,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResponses, setFilteredResponses] = useState(SAVED_RESPONSES);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Filter responses based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResponses(SAVED_RESPONSES);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = SAVED_RESPONSES.filter(
      (response) =>
        response.text.toLowerCase().includes(query) ||
        response.shortcut.toLowerCase().includes(query) ||
        response.category.toLowerCase().includes(query)
    );
    setFilteredResponses(filtered);
  }, [searchQuery]);

  // Group responses by category
  const groupedResponses = filteredResponses.reduce((acc, response) => {
    if (!acc[response.category]) {
      acc[response.category] = [];
    }
    acc[response.category].push(response);
    return acc;
  }, {} as Record<string, typeof SAVED_RESPONSES>);

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-0 mb-2 w-96 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={18} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-neutral-900">Saved Responses</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search responses..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
        </div>
      </div>

      {/* Responses List */}
      <div className="max-h-80 overflow-y-auto">
        {Object.keys(groupedResponses).length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-500">
            No saved responses found
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedResponses).map(([category, responses]) => (
              <div key={category} className="mb-3 last:mb-0">
                {/* Category Header */}
                <div className="px-2 py-1 text-xs font-semibold text-neutral-500 uppercase">
                  {category}
                </div>

                {/* Responses */}
                <div className="space-y-1">
                  {responses.map((response) => (
                    <motion.button
                      key={response.id}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onSelect(response.text)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <code className="text-xs font-mono text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                          {response.shortcut}
                        </code>
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <Clock size={12} />
                          <span>{response.usageCount}</span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-700 line-clamp-2 group-hover:text-neutral-900">
                        {response.text}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-neutral-200 bg-neutral-50">
        <p className="text-xs text-neutral-500">
          Tip: Type the shortcut in your message to quickly insert a response
        </p>
      </div>
    </motion.div>
  );
};
