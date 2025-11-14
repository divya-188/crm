import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Loader2, User as UserIcon, X, Phone, Mail, MapPin, Tag, Building2 } from 'lucide-react';
import { contactsService } from '../../services/contacts.service';
import { Contact } from '../../types/models.types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import toast from 'react-hot-toast';

interface ContactInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  contact?: Contact | null;
  mode?: 'create' | 'edit';
}

const ContactInlineForm: React.FC<ContactInlineFormProps> = ({ 
  onSuccess, 
  onCancel, 
  contact = null,
  mode = 'create'
}) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' || !!contact;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneNumber: '',
    company: '',
    position: '',
    address: '',
    city: '',
    country: '',
    tags: [] as string[],
    notes: '',
  });

  const [tagInput, setTagInput] = useState('');

  // Populate form data when editing
  useEffect(() => {
    if (contact && isEditMode) {
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        phoneNumber: contact.phoneNumber || '',
        company: (contact as any).company || '',
        position: (contact as any).position || '',
        address: (contact as any).address || '',
        city: (contact as any).city || '',
        country: (contact as any).country || '',
        tags: contact.tags || [],
        notes: (contact as any).notes || '',
      });
    }
  }, [contact, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data: any) => contactsService.createContact(data),
    onSuccess: () => {
      toast.success('Contact created successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create contact');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => contactsService.updateContact(contact!.id, data),
    onSuccess: () => {
      toast.success('Contact updated successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update contact');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() && !formData.lastName.trim() && !formData.email.trim()) {
      toast.error('Please provide at least a name or email');
      return;
    }

    const submitData = {
      ...formData,
      phoneNumber: formData.phone || formData.phoneNumber,
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-primary-200 dark:border-primary-800 shadow-xl p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <UserIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditMode ? 'Edit Contact' : 'Add New Contact'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditMode ? 'Update contact information' : 'Add a new contact to your database'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                First Name
              </label>
              <Input
                value={formData.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('firstName', e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Last Name
              </label>
              <Input
                value={formData.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('lastName', e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-600" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone || formData.phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Professional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Company
              </label>
              <Input
                value={formData.company}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('company', e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Position
              </label>
              <Input
                value={formData.position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('position', e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            Location Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Address
              </label>
              <Input
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                City
              </label>
              <Input
                value={formData.city}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('city', e.target.value)}
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Country
              </label>
              <Input
                value={formData.country}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('country', e.target.value)}
                placeholder="United States"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-600" />
            Tags
          </h3>
          <div>
            <div className="flex gap-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag and press Enter"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this contact..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Contact' : 'Create Contact'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default ContactInlineForm;
