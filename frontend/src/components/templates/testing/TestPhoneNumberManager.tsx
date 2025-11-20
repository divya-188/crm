import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { templatesService } from '@/services/templates.service';
import { formatDistanceToNow } from 'date-fns';

interface TestPhoneNumber {
  id: string;
  phoneNumber: string;
  label?: string;
  wabaId: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface TestPhoneNumberManagerProps {
  wabaId: string;
  onPhoneNumberSelect?: (phoneNumber: string) => void;
  selectedPhoneNumber?: string;
  className?: string;
}

/**
 * TestPhoneNumberManager Component
 * 
 * Manages test phone numbers for template testing:
 * - Display list of test phone numbers
 * - Add new test phone numbers (max 5 per WABA)
 * - Edit phone number labels
 * - Remove test phone numbers
 * - Phone number format validation (E.164)
 * - Usage statistics display
 * 
 * Features:
 * - Max 5 test phone numbers per WABA
 * - E.164 format validation
 * - Inline editing of labels
 * - Usage tracking display
 * - Selection support for testing
 * 
 * Requirements: 12.2
 */
export const TestPhoneNumberManager: React.FC<TestPhoneNumberManagerProps> = ({
  wabaId,
  onPhoneNumberSelect,
  selectedPhoneNumber,
  className,
}) => {
  // State for test phone numbers
  const [testPhoneNumbers, setTestPhoneNumbers] = useState<TestPhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for adding new phone number
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPhoneLabel, setNewPhoneLabel] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // State for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // State for deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load test phone numbers
  useEffect(() => {
    loadTestPhoneNumbers();
  }, [wabaId]);

  const loadTestPhoneNumbers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const numbers = await templatesService.getTestPhoneNumbers(wabaId);
      setTestPhoneNumbers(numbers);

      // Auto-select first number if none selected
      if (!selectedPhoneNumber && numbers.length > 0 && onPhoneNumberSelect) {
        onPhoneNumberSelect(numbers[0].phoneNumber);
      }
    } catch (err: any) {
      console.error('Error loading test phone numbers:', err);
      setError(err.response?.data?.message || 'Failed to load test phone numbers');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate phone number format (E.164)
  const validatePhoneNumber = (phone: string): boolean => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  // Add new test phone number
  const handleAddPhoneNumber = async () => {
    setPhoneError('');

    // Validate phone number
    if (!newPhoneNumber) {
      setPhoneError('Phone number is required');
      return;
    }

    if (!validatePhoneNumber(newPhoneNumber)) {
      setPhoneError('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
      return;
    }

    // Check if already exists
    if (testPhoneNumbers.some(p => p.phoneNumber === newPhoneNumber)) {
      setPhoneError('This phone number is already added');
      return;
    }

    // Check max limit (5 per WABA)
    if (testPhoneNumbers.length >= 5) {
      setPhoneError('Maximum 5 test phone numbers allowed per WABA');
      return;
    }

    setIsAdding(true);

    try {
      const newNumber = await templatesService.addTestPhoneNumber({
        wabaId,
        phoneNumber: newPhoneNumber,
        label: newPhoneLabel || undefined,
      });

      setTestPhoneNumbers([...testPhoneNumbers, newNumber]);

      // Select the new phone number
      if (onPhoneNumberSelect) {
        onPhoneNumberSelect(newNumber.phoneNumber);
      }

      // Reset form
      setNewPhoneNumber('');
      setNewPhoneLabel('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error adding test phone number:', err);
      setPhoneError(
        err.response?.data?.message || 'Failed to add test phone number'
      );
    } finally {
      setIsAdding(false);
    }
  };

  // Start editing a phone number label
  const handleStartEdit = (number: TestPhoneNumber) => {
    setEditingId(number.id);
    setEditLabel(number.label || '');
  };

  // Save edited label
  const handleSaveEdit = async (id: string) => {
    setIsUpdating(true);

    try {
      const updated = await templatesService.updateTestPhoneNumber(id, {
        label: editLabel || undefined,
      });

      setTestPhoneNumbers(
        testPhoneNumbers.map(n => (n.id === id ? { ...n, label: updated.label } : n))
      );

      setEditingId(null);
      setEditLabel('');
    } catch (err: any) {
      console.error('Error updating test phone number:', err);
      setError(err.response?.data?.message || 'Failed to update test phone number');
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  // Remove test phone number
  const handleRemovePhoneNumber = async (id: string) => {
    setDeletingId(id);

    try {
      await templatesService.removeTestPhoneNumber(id);

      const removedNumber = testPhoneNumbers.find(n => n.id === id);
      const updatedNumbers = testPhoneNumbers.filter(n => n.id !== id);
      setTestPhoneNumbers(updatedNumbers);

      // Update selected if removed
      if (selectedPhoneNumber === removedNumber?.phoneNumber && onPhoneNumberSelect) {
        onPhoneNumberSelect(updatedNumbers[0]?.phoneNumber || '');
      }
    } catch (err: any) {
      console.error('Error removing test phone number:', err);
      setError(err.response?.data?.message || 'Failed to remove test phone number');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle phone number selection
  const handleSelectPhoneNumber = (phoneNumber: string) => {
    if (onPhoneNumberSelect) {
      onPhoneNumberSelect(phoneNumber);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Test Phone Numbers</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {testPhoneNumbers.length} of 5 numbers added
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          icon={<Plus className="h-4 w-4" />}
          disabled={testPhoneNumbers.length >= 5 || showAddForm}
        >
          Add Number
        </Button>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-blue-700">
              You can add up to 5 test phone numbers per WhatsApp Business Account.
              These numbers can be used to test templates before production use.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Add Phone Number Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-4 rounded-lg border border-gray-200 bg-gray-50"
          >
            <Input
              label="Phone Number"
              placeholder="+1234567890"
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              error={phoneError}
              helperText="Use E.164 format (e.g., +1234567890)"
            />
            <Input
              label="Label (Optional)"
              placeholder="e.g., My Test Phone"
              value={newPhoneLabel}
              onChange={(e) => setNewPhoneLabel(e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddPhoneNumber}
                loading={isAdding}
                disabled={isAdding}
                fullWidth
              >
                Add Phone Number
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPhoneNumber('');
                  setNewPhoneLabel('');
                  setPhoneError('');
                }}
                disabled={isAdding}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Numbers List */}
      {testPhoneNumbers.length > 0 ? (
        <div className="space-y-2">
          {testPhoneNumbers.map((phone) => (
            <motion.div
              key={phone.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border-2 transition-all',
                selectedPhoneNumber === phone.phoneNumber
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300',
                onPhoneNumberSelect && 'cursor-pointer'
              )}
              onClick={() => onPhoneNumberSelect && handleSelectPhoneNumber(phone.phoneNumber)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {phone.phoneNumber}
                  </p>
                  {editingId === phone.id ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Enter label"
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(phone.id);
                        }}
                        disabled={isUpdating}
                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        disabled={isUpdating}
                        className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 mt-0.5">
                      {phone.label ? (
                        <p className="text-xs text-gray-500 truncate">{phone.label}</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No label</p>
                      )}
                      {phone.usageCount > 0 && (
                        <Badge variant="neutral" size="sm">
                          {phone.usageCount} {phone.usageCount === 1 ? 'use' : 'uses'}
                        </Badge>
                      )}
                    </div>
                  )}
                  {phone.lastUsedAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last used {formatDistanceToNow(new Date(phone.lastUsedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-2">
                {editingId !== phone.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(phone);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit label"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoneNumber(phone.id);
                  }}
                  disabled={deletingId === phone.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Remove"
                >
                  {deletingId === phone.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Phone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No test phone numbers added</p>
            <p className="text-xs text-gray-500 mt-1">
              Click "Add Number" to add a test phone number
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default TestPhoneNumberManager;
