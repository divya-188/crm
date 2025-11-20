import { motion } from 'framer-motion';
import { Plus, Trash2, Phone, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';
import { StepProps, TemplateButton } from '../types';
import Input from '@/components/ui/Input';

const MAX_BUTTON_TEXT_LENGTH = 25;

export function InteractionStep({ data, updateData }: StepProps) {
  // Determine button category
  const hasQuickReply = data.buttons.some(b => b.type === 'QUICK_REPLY');
  const hasCTA = data.buttons.some(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');
  
  const maxButtons = hasQuickReply ? 3 : 2;

  // Check if a button type is selected
  const isTypeSelected = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    return data.buttons.some(b => b.type === type);
  };

  // Check if a button type can be selected
  const canSelectType = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    // If no buttons, can select any
    if (data.buttons.length === 0) return true;
    
    // Cannot mix Quick Reply with CTA
    if (type === 'QUICK_REPLY' && hasCTA) return false;
    if ((type === 'URL' || type === 'PHONE_NUMBER') && hasQuickReply) return false;
    
    // Check max buttons
    if (data.buttons.length >= maxButtons) return false;
    
    return true;
  };

  const addButtonOfType = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    if (!canSelectType(type)) return;

    const newButton: TemplateButton = {
      type,
      text: '',
      ...(type === 'URL' && { url: '' }),
      ...(type === 'PHONE_NUMBER' && { phoneNumber: '' }),
    };
    updateData({ buttons: [...data.buttons, newButton] });
  };

  // Count buttons of each type
  const getButtonCountByType = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    return data.buttons.filter(b => b.type === type).length;
  };

  const removeButton = (index: number) => {
    updateData({
      buttons: data.buttons.filter((_, i) => i !== index),
    });
  };

  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    const newButtons = [...data.buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    updateData({ buttons: newButtons });
  };

  const validateButtons = () => {
    const issues = [];

    // Check for duplicate text
    const texts = data.buttons.map(b => b.text.toLowerCase());
    if (new Set(texts).size !== texts.length) {
      issues.push('Button labels must be unique');
    }

    // Check URL format
    data.buttons.forEach((btn, i) => {
      if (btn.type === 'URL' && btn.url && !btn.url.startsWith('https://')) {
        issues.push(`Button ${i + 1}: URL must start with https://`);
      }
      if (btn.type === 'PHONE_NUMBER' && btn.phoneNumber && !btn.phoneNumber.startsWith('+')) {
        issues.push(`Button ${i + 1}: Phone number must use E.164 format (+country code)`);
      }
    });

    return issues;
  };

  const issues = validateButtons();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Interaction</h3>
        <p className="text-neutral-600">Add buttons to enable customer actions</p>
      </div>

      {/* Button Type Selection - Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-sm font-semibold text-neutral-700 mb-3">
          Choose Button Type
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Quick Reply */}
          <div className="relative">
            <motion.button
              type="button"
              whileHover={{ scale: canSelectType('QUICK_REPLY') ? 1.02 : 1 }}
              whileTap={{ scale: canSelectType('QUICK_REPLY') ? 0.98 : 1 }}
              onClick={() => addButtonOfType('QUICK_REPLY')}
              disabled={!canSelectType('QUICK_REPLY')}
              className={`w-full p-3 rounded-lg border-2 text-center transition-all ${
                isTypeSelected('QUICK_REPLY')
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : canSelectType('QUICK_REPLY')
                  ? 'border-neutral-200 hover:border-neutral-300 hover:shadow-md bg-white shadow-sm'
                  : 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
              }`}
              style={{
                boxShadow: isTypeSelected('QUICK_REPLY') 
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
                  : undefined
              }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isTypeSelected('QUICK_REPLY')
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${
                    isTypeSelected('QUICK_REPLY') ? 'text-primary-900' : 'text-neutral-900'
                  }`}>
                    Quick Reply
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5 leading-tight">
                    {getButtonCountByType('QUICK_REPLY')}/3 added
                  </div>
                </div>
              </div>
              {canSelectType('QUICK_REPLY') && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.button>
          </div>

          {/* Website URL */}
          <div className="relative">
            <motion.button
              type="button"
              whileHover={{ scale: canSelectType('URL') ? 1.02 : 1 }}
              whileTap={{ scale: canSelectType('URL') ? 0.98 : 1 }}
              onClick={() => addButtonOfType('URL')}
              disabled={!canSelectType('URL')}
              className={`w-full p-3 rounded-lg border-2 text-center transition-all ${
                isTypeSelected('URL')
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : canSelectType('URL')
                  ? 'border-neutral-200 hover:border-neutral-300 hover:shadow-md bg-white shadow-sm'
                  : 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
              }`}
              style={{
                boxShadow: isTypeSelected('URL') 
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
                  : undefined
              }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isTypeSelected('URL')
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${
                    isTypeSelected('URL') ? 'text-primary-900' : 'text-neutral-900'
                  }`}>
                    Website URL
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5 leading-tight">
                    {getButtonCountByType('URL')}/2 added
                  </div>
                </div>
              </div>
              {canSelectType('URL') && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.button>
          </div>

          {/* Phone Call */}
          <div className="relative">
            <motion.button
              type="button"
              whileHover={{ scale: canSelectType('PHONE_NUMBER') ? 1.02 : 1 }}
              whileTap={{ scale: canSelectType('PHONE_NUMBER') ? 0.98 : 1 }}
              onClick={() => addButtonOfType('PHONE_NUMBER')}
              disabled={!canSelectType('PHONE_NUMBER')}
              className={`w-full p-3 rounded-lg border-2 text-center transition-all ${
                isTypeSelected('PHONE_NUMBER')
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : canSelectType('PHONE_NUMBER')
                  ? 'border-neutral-200 hover:border-neutral-300 hover:shadow-md bg-white shadow-sm'
                  : 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
              }`}
              style={{
                boxShadow: isTypeSelected('PHONE_NUMBER') 
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
                  : undefined
              }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isTypeSelected('PHONE_NUMBER')
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${
                    isTypeSelected('PHONE_NUMBER') ? 'text-primary-900' : 'text-neutral-900'
                  }`}>
                    Phone Call
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5 leading-tight">
                    {getButtonCountByType('PHONE_NUMBER')}/2 added
                  </div>
                </div>
              </div>
              {canSelectType('PHONE_NUMBER') && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.button>
          </div>
        </div>
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-900">
            ⚠️ <strong>Important:</strong> You cannot mix Quick Reply buttons with Call-to-Action buttons (URL/Phone).
          </p>
        </div>
      </motion.div>

      {/* Button Forms - Inline */}
      {data.buttons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <label className="block text-sm font-semibold text-neutral-700">
            Button Details ({data.buttons.length}/{maxButtons})
          </label>

          {data.buttons.map((button, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {button.type === 'QUICK_REPLY' && <MessageSquare className="w-5 h-5 text-primary-600" />}
                  {button.type === 'URL' && <ExternalLink className="w-5 h-5 text-primary-600" />}
                  {button.type === 'PHONE_NUMBER' && <Phone className="w-5 h-5 text-primary-600" />}
                  <span className="font-semibold text-neutral-900">
                    Button {index + 1}
                    {button.type === 'QUICK_REPLY' && ' - Quick Reply'}
                    {button.type === 'URL' && ' - Website'}
                    {button.type === 'PHONE_NUMBER' && ' - Phone'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeButton(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Button Text *
                </label>
                <Input
                  value={button.text}
                  onChange={(e) => updateButton(index, { text: e.target.value })}
                  placeholder="View Order"
                  maxLength={MAX_BUTTON_TEXT_LENGTH}
                />
                <div className="text-xs text-neutral-500 mt-2 text-right">
                  {button.text.length} / {MAX_BUTTON_TEXT_LENGTH}
                </div>
              </div>

              {button.type === 'URL' && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Website URL *
                  </label>
                  <Input
                    value={button.url || ''}
                    onChange={(e) => updateButton(index, { url: e.target.value })}
                    placeholder="https://example.com/track/order"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Add {`{{1}}`} at the end for dynamic parameter
                  </p>
                </div>
              )}

              {button.type === 'PHONE_NUMBER' && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    value={button.phoneNumber || ''}
                    onChange={(e) => updateButton(index, { phoneNumber: e.target.value })}
                    placeholder="+1234567890"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Use E.164 format with country code
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Validation Issues */}
      {issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-2">Validation Issues</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Skip Notice */}
      {data.buttons.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-50 border border-primary-200 rounded-xl p-4"
        >
          <p className="text-sm text-primary-900">
            💡 <strong>Optional Step:</strong> Buttons are optional but can significantly increase engagement. 
            You can skip this step if your message doesn't require user interaction.
          </p>
        </motion.div>
      )}
    </div>
  );
}
