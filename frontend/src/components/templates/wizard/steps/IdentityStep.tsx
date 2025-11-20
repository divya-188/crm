import React from 'react';
import { motion } from 'framer-motion';
import { StepProps } from '../types';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';

const CATEGORIES = [
  { 
    value: 'utility', 
    label: 'Utility', 
    desc: 'Account updates, alerts, notifications',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    value: 'marketing', 
    label: 'Marketing', 
    desc: 'Promotions, offers, campaigns',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    value: 'authentication', 
    label: 'Authentication', 
    desc: 'OTP, verification codes, security',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
];

const LANGUAGES = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
  { value: 'es_ES', label: 'Spanish (Spain)' },
  { value: 'es_MX', label: 'Spanish (Mexico)' },
  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
  { value: 'pt_PT', label: 'Portuguese (Portugal)' },
  { value: 'hi_IN', label: 'Hindi (India)' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr_FR', label: 'French (France)' },
  { value: 'de_DE', label: 'German (Germany)' },
  { value: 'it_IT', label: 'Italian (Italy)' },
  { value: 'zh_CN', label: 'Chinese (Simplified)' },
  { value: 'zh_TW', label: 'Chinese (Traditional)' },
  { value: 'ja_JP', label: 'Japanese' },
  { value: 'ko_KR', label: 'Korean' },
  { value: 'ru_RU', label: 'Russian' },
  { value: 'id_ID', label: 'Indonesian' },
  { value: 'th_TH', label: 'Thai' },
  { value: 'vi_VN', label: 'Vietnamese' },
  { value: 'tr_TR', label: 'Turkish' },
];

export function IdentityStep({ data, updateData }: StepProps) {
  const handleNameChange = (value: string) => {
    // Auto-convert to lowercase and replace spaces with underscores
    const formatted = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    updateData({ name: formatted });
  };

  // Set default language to en_US if not set
  React.useEffect(() => {
    if (!data.language) {
      updateData({ language: 'en_US' });
    }
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Template Identity</h3>
        <p className="text-sm text-neutral-600">Give your template a unique name and classify it properly</p>
      </div>

      {/* Template Name & Display Name in Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Template Name *
          </label>
          <Input
            value={data.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="order_confirmation"
          />
          <p className="mt-2 text-xs text-neutral-500">
            Auto-formatted: lowercase_with_underscores
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Display Name (Optional)
          </label>
          <Input
            value={data.displayName || ''}
            onChange={(e) => updateData({ displayName: e.target.value })}
            placeholder="Order Confirmation"
          />
          <p className="mt-2 text-xs text-neutral-500">Human-readable name</p>
        </motion.div>
      </div>

      {/* Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-sm font-semibold text-neutral-700 mb-3">
          Category *
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.value}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateData({ category: cat.value })}
              className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                data.category === cat.value
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md bg-white shadow-sm'
              }`}
              style={{
                boxShadow: data.category === cat.value 
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
                  : undefined
              }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  data.category === cat.value
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  <div className="scale-75">{cat.icon}</div>
                </div>
                <div>
                  <div className={`font-semibold text-sm ${
                    data.category === cat.value
                      ? 'text-primary-900'
                      : 'text-neutral-900'
                  }`}>
                    {cat.label}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5 leading-tight">{cat.desc}</div>
                </div>
              </div>
              {data.category === cat.value && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Language */}
      <LanguageSelect data={data} updateData={updateData} />

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          Description (Optional)
        </label>
        <Textarea
          value={data.description || ''}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Brief description of what this template is for..."
          rows={2}
        />
        <p className="mt-2 text-xs text-neutral-500">Helps your team understand the template's purpose</p>
      </motion.div>
    </div>
  );
}

// Language Select Component with Search
function LanguageSelect({ data, updateData }: Pick<StepProps, 'data' | 'updateData'>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const filteredLanguages = LANGUAGES.filter((lang) =>
    lang.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLanguage = LANGUAGES.find((lang) => lang.value === (data.language || 'en_US'));

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative"
      ref={dropdownRef}
    >
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Language *
      </label>
      
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-left text-neutral-900 hover:border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all flex items-center justify-between"
      >
        <span>{selectedLanguage?.label || 'Select language'}</span>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-neutral-200 rounded-xl shadow-xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="p-3 border-b border-neutral-200">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full px-4 py-2 pl-10 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                autoFocus
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => {
                    updateData({ language: lang.value });
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    data.language === lang.value
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{lang.label}</span>
                    {data.language === lang.value && (
                      <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-neutral-500">
                No languages found
              </div>
            )}
          </div>
        </motion.div>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        Select the language for your template content
      </p>
    </motion.div>
  );
}
