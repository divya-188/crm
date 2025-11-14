import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Variable, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Variable {
  name: string;
  type: string;
  description?: string;
}

interface VariablePickerProps {
  onSelect: (variable: string) => void;
  availableVariables?: Variable[];
  placeholder?: string;
  className?: string;
}

const defaultVariables: Variable[] = [
  { name: 'contact.name', type: 'string', description: 'Contact name' },
  { name: 'contact.phone', type: 'string', description: 'Contact phone number' },
  { name: 'contact.email', type: 'string', description: 'Contact email' },
  { name: 'user.input', type: 'string', description: 'Last user input' },
  { name: 'flow.id', type: 'string', description: 'Current flow ID' },
  { name: 'conversation.id', type: 'string', description: 'Current conversation ID' },
];

const VariablePicker: React.FC<VariablePickerProps> = ({
  onSelect,
  availableVariables = defaultVariables,
  placeholder = 'Select a variable...',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredVariables = availableVariables.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (variableName: string) => {
    onSelect(`{{${variableName}}}`);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
      >
        <Variable className="w-4 h-4 text-primary-600" />
        <span className="text-neutral-700">{placeholder}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-neutral-200 z-50 overflow-hidden"
            >
              {/* Search */}
              <div className="p-3 border-b border-neutral-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search variables..."
                    className="w-full pl-10 pr-8 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Variables List */}
              <div className="max-h-64 overflow-y-auto">
                {filteredVariables.length > 0 ? (
                  <div className="p-2">
                    {filteredVariables.map((variable) => (
                      <button
                        key={variable.name}
                        onClick={() => handleSelect(variable.name)}
                        className="w-full flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors text-left"
                      >
                        <Variable className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-neutral-900 truncate">
                            {`{{${variable.name}}}`}
                          </div>
                          {variable.description && (
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {variable.description}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded flex-shrink-0">
                          {variable.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-neutral-500 text-sm">
                    No variables found
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-neutral-200 bg-neutral-50">
                <p className="text-xs text-neutral-600">
                  Variables are wrapped in double curly braces: <code className="font-mono bg-white px-1 py-0.5 rounded">{'{{variable}}'}</code>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VariablePicker;
