import { motion } from 'framer-motion';
import { Users, Edit, Trash2, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ContactSegment } from '@/types/models.types';
import { fadeInUp, staggerContainer } from '@/lib/motion-variants';

interface SegmentListProps {
  segments: ContactSegment[];
  onView: (segment: ContactSegment) => void;
  onEdit: (segment: ContactSegment) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const SegmentList = ({
  segments,
  onView,
  onEdit,
  onDelete,
  isLoading,
}: SegmentListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No segments created yet. Create your first segment to organize contacts.
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {segments.map((segment) => (
        <motion.div key={segment.id} variants={fadeInUp}>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {segment.name}
                </h3>
                {segment.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {segment.description}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Count */}
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {segment.contactCount} contacts
              </span>
            </div>

            {/* Criteria Summary */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {segment.criteria.logic}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {segment.criteria.conditions.length} conditions
                </Badge>
              </div>
            </div>

            {/* Last Calculated */}
            {segment.lastCalculatedAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Updated: {new Date(segment.lastCalculatedAt).toLocaleDateString()}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(segment)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(segment)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(segment.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};
