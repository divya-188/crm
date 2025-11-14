import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Spinner from '@/components/ui/Spinner';
import { SegmentBuilder } from './SegmentBuilder';
import { ContactSegment, ContactSegmentCriteria } from '@/types/models.types';
import { contactsService } from '@/services';
import { toast } from 'react-hot-toast';

interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment?: ContactSegment | null;
  onSuccess?: () => void;
}

export const SegmentModal = ({
  isOpen,
  onClose,
  segment,
  onSuccess,
}: SegmentModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<ContactSegmentCriteria>({
    logic: 'AND',
    conditions: [],
  });
  const [previewCount, setPreviewCount] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setDescription(segment.description || '');
      setCriteria(segment.criteria);
      setPreviewCount(segment.contactCount);
    } else {
      setName('');
      setDescription('');
      setCriteria({ logic: 'AND', conditions: [] });
      setPreviewCount(undefined);
    }
  }, [segment, isOpen]);

  const validateConditions = () => {
    if (criteria.conditions.length === 0) {
      toast.error('Please add at least one condition');
      return false;
    }

    // Check if all conditions that need values have them
    for (let i = 0; i < criteria.conditions.length; i++) {
      const condition = criteria.conditions[i];
      const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator);
      
      if (needsValue) {
        if (Array.isArray(condition.value)) {
          if (condition.value.length === 0) {
            toast.error(`Condition ${i + 1}: Please enter at least one value`);
            return false;
          }
        } else if (!condition.value || condition.value.toString().trim() === '') {
          toast.error(`Condition ${i + 1}: Please enter a value`);
          return false;
        }
      }
    }

    return true;
  };

  const handlePreview = async () => {
    if (!validateConditions()) {
      return;
    }

    setIsPreviewing(true);
    try {
      const result = await contactsService.previewSegment(criteria);
      setPreviewCount(result.count);
      toast.success(`Found ${result.count} matching contacts`);
    } catch (error) {
      toast.error('Failed to preview segment');
      console.error('Preview error:', error);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a segment name');
      return;
    }

    if (!validateConditions()) {
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        criteria,
      };

      if (segment) {
        await contactsService.updateSegment(segment.id, data);
        toast.success('Segment updated successfully');
      } else {
        await contactsService.createSegment(data);
        toast.success('Segment created successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save segment');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={segment ? 'Edit Segment' : 'Create New Segment'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Segment Name *
            </label>
            <Input
              type="text"
              placeholder="e.g., Active Customers, VIP Contacts"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Textarea
              placeholder="Describe this segment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Segment Builder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Segment Criteria *
          </label>
          <SegmentBuilder
            criteria={criteria}
            onChange={setCriteria}
            previewCount={previewCount}
            onPreview={handlePreview}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isPreviewing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isPreviewing || !name.trim() || criteria.conditions.length === 0}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : segment ? (
              'Update Segment'
            ) : (
              'Create Segment'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
