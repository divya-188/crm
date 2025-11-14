import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { contactsService } from '@/services/contacts.service';
import { CustomFieldDefinition, CustomFieldType } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { CustomFieldModal } from './CustomFieldModal';
import { fadeIn } from '@/lib/motion-variants';

export const CustomFieldsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Fetch custom field definitions
  const { data: customFields = [], isLoading } = useQuery({
    queryKey: ['customFieldDefinitions', includeInactive],
    queryFn: () => contactsService.getCustomFieldDefinitions(includeInactive),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsService.deleteCustomFieldDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFieldDefinitions'] });
      toast.success('Custom field deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete custom field');
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      contactsService.updateCustomFieldDefinition(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFieldDefinitions'] });
      toast.success('Custom field status updated');
    },
    onError: () => {
      toast.error('Failed to update custom field status');
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) =>
      contactsService.reorderCustomFieldDefinition(id, sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFieldDefinitions'] });
      toast.success('Custom field order updated');
    },
    onError: () => {
      toast.error('Failed to update custom field order');
    },
  });

  const handleCreate = () => {
    setEditingField(null);
    setIsModalOpen(true);
  };

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this custom field? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (field: CustomFieldDefinition) => {
    toggleActiveMutation.mutate({ id: field.id, isActive: !field.isActive });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const draggedField = customFields[draggedIndex];
    const newSortOrder = dropIndex;

    // Update the sort order
    reorderMutation.mutate({ id: draggedField.id, sortOrder: newSortOrder });
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getFieldTypeLabel = (type: CustomFieldType): string => {
    const labels: Record<CustomFieldType, string> = {
      [CustomFieldType.TEXT]: 'Text',
      [CustomFieldType.NUMBER]: 'Number',
      [CustomFieldType.DATE]: 'Date',
      [CustomFieldType.DROPDOWN]: 'Dropdown',
      [CustomFieldType.CHECKBOX]: 'Checkbox',
    };
    return labels[type];
  };

  const getFieldTypeColor = (type: CustomFieldType): 'primary' | 'secondary' | 'success' | 'info' | 'warning' => {
    const colors: Record<CustomFieldType, 'primary' | 'secondary' | 'success' | 'info' | 'warning'> = {
      [CustomFieldType.TEXT]: 'info',
      [CustomFieldType.NUMBER]: 'success',
      [CustomFieldType.DATE]: 'secondary',
      [CustomFieldType.DROPDOWN]: 'warning',
      [CustomFieldType.CHECKBOX]: 'primary',
    };
    return colors[type];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Fields</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define custom fields to store additional contact information ({customFields.length}/50)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeInactive(!includeInactive)}
          >
            {includeInactive ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Active Only
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Show All
              </>
            )}
          </Button>
          <Button onClick={handleCreate} disabled={customFields.length >= 50}>
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Field
          </Button>
        </div>
      </div>

      {/* Custom Fields List */}
      {customFields.length === 0 ? (
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No custom fields yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create custom fields to capture additional contact information
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Custom Field
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {customFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <Card 
                    className={`p-4 transition-all ${
                      !field.isActive ? 'opacity-60' : ''
                    } ${
                      draggedIndex === index ? 'opacity-50 scale-95' : ''
                    } ${
                      dragOverIndex === index && draggedIndex !== index 
                        ? 'border-2 border-primary-500 border-dashed' 
                        : ''
                    }`}
                  >
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 mt-1 cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Field Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                              {field.label}
                            </h3>
                            {field.isRequired && (
                              <Badge variant="danger" size="sm">
                                Required
                              </Badge>
                            )}
                            {!field.isActive && (
                              <Badge variant="neutral" size="sm">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                              {field.key}
                            </span>
                            <Badge variant={getFieldTypeColor(field.type)} size="sm">
                              {getFieldTypeLabel(field.type)}
                            </Badge>
                          </div>
                          {field.helpText && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {field.helpText}
                            </p>
                          )}
                          {field.type === CustomFieldType.DROPDOWN && field.options && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {field.options.map((option, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                  {option}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(field)}
                            title={field.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {field.isActive ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(field)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(field.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Custom Field Modal */}
      <CustomFieldModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingField(null);
        }}
        field={editingField}
      />
    </div>
  );
};
