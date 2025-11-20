import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export type SortField = 'name' | 'createdAt' | 'usageCount' | 'approvedAt' | 'qualityScore';
export type SortOrder = 'ASC' | 'DESC';

export interface SortOptions {
  sortBy: SortField;
  sortOrder: SortOrder;
}

interface TemplateSortingProps {
  sortOptions: SortOptions;
  onSortChange: (options: SortOptions) => void;
}

const SORT_FIELDS: Array<{
  value: SortField;
  label: string;
  description: string;
}> = [
  {
    value: 'name',
    label: 'Name',
    description: 'Sort alphabetically by template name',
  },
  {
    value: 'createdAt',
    label: 'Creation Date',
    description: 'Sort by when template was created',
  },
  {
    value: 'usageCount',
    label: 'Usage Count',
    description: 'Sort by number of times used',
  },
  {
    value: 'approvedAt',
    label: 'Approval Date',
    description: 'Sort by when template was approved',
  },
  {
    value: 'qualityScore',
    label: 'Quality Score',
    description: 'Sort by template quality rating',
  },
];

export default function TemplateSorting({
  sortOptions,
  onSortChange,
}: TemplateSortingProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSortFieldChange = (field: SortField) => {
    onSortChange({
      sortBy: field,
      sortOrder: sortOptions.sortOrder,
    });
    setIsOpen(false);
  };

  const handleToggleSortOrder = () => {
    onSortChange({
      sortBy: sortOptions.sortBy,
      sortOrder: sortOptions.sortOrder === 'ASC' ? 'DESC' : 'ASC',
    });
  };

  const currentField = SORT_FIELDS.find((f) => f.value === sortOptions.sortBy);
  const isAscending = sortOptions.sortOrder === 'ASC';

  return (
    <div className="relative">
      <Card className="p-4 flex items-center gap-2">
        {/* Sort Field Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 min-w-[180px] justify-between"
          >
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentField?.label || 'Sort by'}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOpen(false)}
                />

                {/* Dropdown Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-20"
                >
                  <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      Sort By
                    </p>
                  </div>

                  <div className="py-1">
                    {SORT_FIELDS.map((field) => {
                      const isSelected = sortOptions.sortBy === field.value;

                      return (
                        <button
                          key={field.value}
                          onClick={() => handleSortFieldChange(field.value)}
                          className={`w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
                            isSelected
                              ? 'bg-primary-50 dark:bg-primary-900/20'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-sm font-medium ${
                                    isSelected
                                      ? 'text-primary-600 dark:text-primary-400'
                                      : 'text-neutral-900 dark:text-white'
                                  }`}
                                >
                                  {field.label}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {field.description}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Sort Order Toggle */}
        <Button
          variant="outline"
          onClick={handleToggleSortOrder}
          className="flex items-center gap-2"
          title={isAscending ? 'Ascending order' : 'Descending order'}
        >
          {isAscending ? (
            <>
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                Ascending
              </span>
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                Descending
              </span>
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}
