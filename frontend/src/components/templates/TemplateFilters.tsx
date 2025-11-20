import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Save, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import Toast from '@/lib/toast-system';

export type SortField = 'name' | 'createdAt' | 'usageCount' | 'approvedAt' | 'qualityScore';
export type SortOrder = 'ASC' | 'DESC';

export interface SortOptions {
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface TemplateFilterValues {
  status: string;
  category: string;
  language: string;
  search: string;
  startDate?: string;
  endDate?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: TemplateFilterValues;
}

interface TemplateFiltersProps {
  filters: TemplateFilterValues;
  onFiltersChange: (filters: TemplateFilterValues) => void;
  onReset?: () => void;
  sortOptions: SortOptions;
  onSortChange: (options: SortOptions) => void;
}

const DEFAULT_FILTERS: TemplateFilterValues = {
  status: 'all',
  category: 'all',
  language: 'all',
  search: '',
  startDate: undefined,
  endDate: undefined,
};

interface PresetWithDescription extends FilterPreset {
  description: string;
}

const BUILT_IN_PRESETS: PresetWithDescription[] = [
  { 
    id: 'approved', 
    name: 'Approved Templates', 
    description: 'Show only templates approved by Meta',
    filters: { ...DEFAULT_FILTERS, status: 'approved' } 
  },
  { 
    id: 'pending', 
    name: 'Pending Review', 
    description: 'Templates waiting for Meta approval',
    filters: { ...DEFAULT_FILTERS, status: 'pending' } 
  },
  { 
    id: 'draft', 
    name: 'Draft Templates', 
    description: 'Templates not yet submitted for review',
    filters: { ...DEFAULT_FILTERS, status: 'draft' } 
  },
  { 
    id: 'rejected', 
    name: 'Rejected Templates', 
    description: 'Templates rejected by Meta',
    filters: { ...DEFAULT_FILTERS, status: 'rejected' } 
  },
];

const SORT_FIELDS: Array<{ value: SortField; label: string; description: string }> = [
  { value: 'name', label: 'Name', description: 'Sort alphabetically by template name' },
  { value: 'createdAt', label: 'Creation Date', description: 'Sort by when template was created' },
  { value: 'usageCount', label: 'Usage Count', description: 'Sort by number of times used' },
  { value: 'approvedAt', label: 'Approval Date', description: 'Sort by when template was approved' },
  { value: 'qualityScore', label: 'Quality Score', description: 'Sort by template quality rating' },
];

export default function TemplateFilters({ filters, onFiltersChange, onReset, sortOptions, onSortChange }: TemplateFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const filtersRef = useRef<HTMLDivElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => templatesService.getCategories(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data: languagesData } = useQuery({
    queryKey: ['template-languages'],
    queryFn: () => templatesService.getLanguages(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    const saved = localStorage.getItem('template-filter-presets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false);
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) setShowPresets(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (key: keyof TemplateFilterValues, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDateChange = (start?: string, end?: string) => {
    onFiltersChange({ ...filters, startDate: start, endDate: end });
  };

  const handleReset = () => {
    onFiltersChange(DEFAULT_FILTERS);
    if (onReset) onReset();
  };

  const applyPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
    setShowPresets(false);
    Toast.success(`Applied: ${preset.name}`);
  };

  const deletePreset = (id: string) => {
    const updated = savedPresets.filter(p => p.id !== id);
    localStorage.setItem('template-filter-presets', JSON.stringify(updated));
    setSavedPresets(updated);
    Toast.success('Preset deleted');
  };

  const activeCount = [
    filters.status !== 'all',
    filters.category !== 'all',
    filters.language !== 'all',
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  const hasActive = filters.search !== '' || activeCount > 0;

  const categoryOpts = [
    { value: 'all', label: 'All Categories' },
    ...(categoriesData?.categories || []).map((c: any) => ({ value: c.code, label: c.name })),
  ];

  const languageOpts = [
    { value: 'all', label: 'All Languages' },
    ...(languagesData?.languages || []).map((l: any) => ({ value: l.code, label: l.name })),
  ];

  const statusOpts = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const saveCurrentPreset = () => {
    if (!presetName.trim()) {
      Toast.error('Please enter a preset name');
      return;
    }
    
    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: presetName.trim(),
      filters: { ...filters },
    };
    
    const updated = [...savedPresets, newPreset];
    localStorage.setItem('template-filter-presets', JSON.stringify(updated));
    setSavedPresets(updated);
    setShowSaveInput(false);
    setPresetName('');
    Toast.success('Preset saved successfully');
  };

  const removeFilter = (key: keyof TemplateFilterValues) => {
    if (key === 'search') {
      handleChange('search', '');
    } else if (key === 'startDate' || key === 'endDate') {
      handleDateChange(undefined, undefined);
    } else {
      handleChange(key, 'all');
    }
  };

  const getActiveFilters = () => {
    const active: Array<{ key: keyof TemplateFilterValues; label: string; value: string }> = [];
    
    if (filters.status !== 'all') {
      const statusLabel = statusOpts.find(o => o.value === filters.status)?.label || filters.status;
      active.push({ key: 'status', label: 'Status', value: statusLabel });
    }
    if (filters.category !== 'all') {
      const categoryLabel = categoryOpts.find(o => o.value === filters.category)?.label || filters.category;
      active.push({ key: 'category', label: 'Category', value: categoryLabel });
    }
    if (filters.language !== 'all') {
      const languageLabel = languageOpts.find(o => o.value === filters.language)?.label || filters.language;
      active.push({ key: 'language', label: 'Language', value: languageLabel });
    }
    if (filters.startDate || filters.endDate) {
      const dateRange = `${filters.startDate || '...'} - ${filters.endDate || '...'}`;
      active.push({ key: 'startDate', label: 'Date Range', value: dateRange });
    }
    
    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg">
      {/* First Row - Main Controls */}
      <div className="flex items-center gap-3 p-3">
        {/* Search */}
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search templates..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-neutral-800"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600"></div>

      {/* Filters Dropdown */}
      <div className="relative flex-shrink-0" ref={filtersRef}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Filter className="w-4 h-4 flex-shrink-0" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-primary-500 text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Filter Templates</h3>
              </div>

              {/* Filter Options */}
              <div className="max-h-96 overflow-y-auto">
                {/* Status Section */}
                <div className="border-b border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => setShowStatusOptions(!showStatusOptions)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between"
                  >
                    <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Status</h4>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showStatusOptions ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showStatusOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="py-1">
                          {statusOpts.map((option) => {
                            const isSelected = filters.status === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => {
                                  handleChange('status', option.value);
                                  setShowStatusOptions(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 transition-colors ${
                                  isSelected
                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className={`text-sm font-medium ${
                                    isSelected
                                      ? 'text-primary-600 dark:text-primary-400'
                                      : 'text-neutral-900 dark:text-white'
                                  }`}>
                                    {option.label}
                                  </span>
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Category Section */}
                <div className="border-b border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => setShowCategoryOptions(!showCategoryOptions)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between"
                  >
                    <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Category</h4>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showCategoryOptions ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showCategoryOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="py-1">
                          {categoryOpts.map((option) => {
                            const isSelected = filters.category === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => {
                                  handleChange('category', option.value);
                                  setShowCategoryOptions(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 transition-colors ${
                                  isSelected
                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className={`text-sm font-medium ${
                                    isSelected
                                      ? 'text-primary-600 dark:text-primary-400'
                                      : 'text-neutral-900 dark:text-white'
                                  }`}>
                                    {option.label}
                                  </span>
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Language Section */}
                <div className="border-b border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => {
                      setShowLanguageOptions(!showLanguageOptions);
                      if (!showLanguageOptions) setLanguageSearch('');
                    }}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between"
                  >
                    <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Language</h4>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showLanguageOptions ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showLanguageOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {/* Search Input */}
                        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search languages..."
                              value={languageSearch}
                              onChange={(e) => setLanguageSearch(e.target.value)}
                              className="w-full h-8 pl-9 pr-3 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                        
                        {/* Language Options */}
                        <div className="py-1 max-h-60 overflow-y-auto">
                          {languageOpts
                            .filter(option => 
                              option.label.toLowerCase().includes(languageSearch.toLowerCase())
                            )
                            .map((option) => {
                              const isSelected = filters.language === option.value;
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => {
                                    handleChange('language', option.value);
                                    setShowLanguageOptions(false);
                                    setLanguageSearch('');
                                  }}
                                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                                    isSelected
                                      ? 'bg-primary-50 dark:bg-primary-900/20'
                                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className={`text-sm font-medium ${
                                      isSelected
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-neutral-900 dark:text-white'
                                    }`}>
                                      {option.label}
                                    </span>
                                    {isSelected && (
                                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          {languageOpts.filter(option => 
                            option.label.toLowerCase().includes(languageSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                              No languages found
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Date Range Section */}
                <div>
                  <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900/50">
                    <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Date Range</h4>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">From</label>
                        <input
                          type="date"
                          value={filters.startDate || ''}
                          onChange={(e) => handleDateChange(e.target.value, filters.endDate)}
                          className="w-full h-9 px-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">To</label>
                        <input
                          type="date"
                          value={filters.endDate || ''}
                          onChange={(e) => handleDateChange(filters.startDate, e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <button
                  onClick={handleReset}
                  disabled={!hasActive}
                  className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Presets Dropdown */}
      <div className="relative flex-shrink-0" ref={presetsRef}>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Save className="w-4 h-4 flex-shrink-0" />
          <span>Presets</span>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Filter Presets</h3>
              </div>

              {/* Built-in Presets */}
              <div className="py-1">
                {BUILT_IN_PRESETS.map((preset) => {
                  // Check if this preset matches current filters
                  const isSelected = 
                    preset.filters.status === filters.status &&
                    preset.filters.category === filters.category &&
                    preset.filters.language === filters.language &&
                    !filters.startDate &&
                    !filters.endDate &&
                    !filters.search;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className={`text-base font-semibold mb-1 ${
                            isSelected
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-neutral-900 dark:text-white'
                          }`}>
                            {preset.name}
                          </div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 mt-1">
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
                
              {/* Custom Presets */}
              {savedPresets.length > 0 && (
                <>
                  <div className="border-t border-neutral-200 dark:border-neutral-700">
                    <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900/50">
                      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Custom Presets</h4>
                    </div>
                  </div>
                  <div className="py-1">
                    {savedPresets.map((preset) => {
                      // Check if this preset matches current filters
                      const isSelected = 
                        preset.filters.status === filters.status &&
                        preset.filters.category === filters.category &&
                        preset.filters.language === filters.language &&
                        preset.filters.startDate === filters.startDate &&
                        preset.filters.endDate === filters.endDate &&
                        preset.filters.search === filters.search;

                      return (
                        <div key={preset.id} className="group relative">
                          <button
                            onClick={() => applyPreset(preset)}
                            className={`w-full text-left px-4 py-3 transition-colors pr-12 ${
                              isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/20'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className={`text-base font-semibold ${
                                  isSelected
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-neutral-900 dark:text-white'
                                }`}>
                                  {preset.name}
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                  Custom filter configuration
                                </p>
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0 mt-1">
                                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreset(preset.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all"
                            title="Delete preset"
                          >
                            <X className="w-4 h-4 text-danger-500" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>



        {/* Divider before sorting */}
        <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600"></div>

        {/* Sort By Dropdown */}
      <div className="relative flex-shrink-0" ref={sortRef}>
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm font-medium whitespace-nowrap"
        >
          <ArrowUpDown className="w-4 h-4 flex-shrink-0" />
          <span>{SORT_FIELDS.find(f => f.value === sortOptions.sortBy)?.label || 'Sort'}</span>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showSortMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Sort By</h3>
              </div>

              {/* Sort Options */}
              <div className="py-1">
                {SORT_FIELDS.map((field) => {
                  const isSelected = sortOptions.sortBy === field.value;
                  
                  return (
                    <button
                      key={field.value}
                      onClick={() => {
                        onSortChange({ ...sortOptions, sortBy: field.value });
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className={`text-base font-semibold mb-1 ${
                            isSelected
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-neutral-900 dark:text-white'
                          }`}>
                            {field.label}
                          </div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {field.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 mt-1">
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        {/* Sort Order Toggle */}
        <button
          onClick={() => onSortChange({ ...sortOptions, sortOrder: sortOptions.sortOrder === 'ASC' ? 'DESC' : 'ASC' })}
          className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm font-medium whitespace-nowrap"
          title={sortOptions.sortOrder === 'ASC' ? 'Ascending' : 'Descending'}
        >
          {sortOptions.sortOrder === 'ASC' ? (
            <>
              <ArrowUp className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Ascending</span>
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Descending</span>
            </>
          )}
        </button>
      </div>

      {/* Second Row - Active Filters & Actions */}
      <AnimatePresence>
        {(activeFilters.length > 0 || showSaveInput) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <div className="p-3 flex items-center gap-2 flex-wrap">
              {/* Active Filter Badges */}
              {activeFilters.map((filter) => (
                <motion.div
                  key={filter.key}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-sm"
                >
                  <span className="font-medium text-primary-700 dark:text-primary-300">{filter.label}:</span>
                  <span className="text-primary-600 dark:text-primary-400">{filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="ml-1 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  </button>
                </motion.div>
              ))}

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Save Preset Input */}
              <AnimatePresence>
                {showSaveInput && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, x: -20 }}
                    animate={{ width: 'auto', opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Preset name..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveCurrentPreset();
                        if (e.key === 'Escape') {
                          setShowSaveInput(false);
                          setPresetName('');
                        }
                      }}
                      autoFocus
                      className="h-8 px-3 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(167,139,250,0.1)] transition-all min-w-[200px]"
                    />
                    <button
                      onClick={saveCurrentPreset}
                      className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSaveInput(false);
                        setPresetName('');
                      }}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              {!showSaveInput && activeFilters.length > 0 && (
                <>
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Preset
                  </button>
                  <button
                    onClick={handleReset}
                    className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-danger-300 dark:border-danger-600 bg-danger-50 dark:bg-danger-900/20 hover:bg-danger-100 dark:hover:bg-danger-900/30 text-danger-600 dark:text-danger-400 text-sm font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
