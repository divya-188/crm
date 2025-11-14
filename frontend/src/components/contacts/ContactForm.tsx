import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { Contact, CreateContactDto, UpdateContactDto } from '@/types/models.types';
import { CustomFieldsEditor } from './CustomFieldsEditor';

interface ContactFormProps {
  contact?: Contact;
  onSuccess: () => void;
}

export const ContactForm = ({ contact, onSuccess }: ContactFormProps) => {
  const isEditing = !!contact;
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, any>>(
    contact?.customFields || {}
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateContactDto | UpdateContactDto>({
    defaultValues: contact
      ? {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || contact.phoneNumber,
        }
      : {},
  });

  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();

  const onSubmit = async (data: CreateContactDto | UpdateContactDto) => {
    try {
      const payload = {
        ...data,
        tags,
        customFields,
      };

      if (isEditing && contact) {
        await updateMutation.mutateAsync({
          id: contact.id,
          data: payload as UpdateContactDto,
        });
      } else {
        await createMutation.mutateAsync(payload as CreateContactDto);
      }

      onSuccess();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* First Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          First Name
        </label>
        <Input
          {...register('firstName')}
          placeholder="John"
          error={errors.firstName?.message}
        />
      </div>

      {/* Last Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Last Name
        </label>
        <Input
          {...register('lastName')}
          placeholder="Doe"
          error={errors.lastName?.message}
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone Number {!isEditing && <span className="text-red-500">*</span>}
        </label>
        <Input
          {...register('phone' as any, {
            required: !isEditing ? 'Phone number is required' : false,
          })}
          placeholder="+1234567890"
          error={(errors as any).phone?.message}
          disabled={isEditing}
        />
        {isEditing && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Phone number cannot be changed
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <Input
          {...register('email', {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add a tag..."
          />
          <Button type="button" onClick={handleAddTag} variant="outline">
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="primary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-blue-600 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Custom Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom Fields
        </label>
        <CustomFieldsEditor
          values={customFields}
          onChange={setCustomFields}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
};
