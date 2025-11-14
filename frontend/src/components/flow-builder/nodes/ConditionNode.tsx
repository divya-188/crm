import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { GitBranch, Trash2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConditionNodeData {
  label: string;
  condition?: string;
  nodeType: string;
  isValid?: boolean;
  onConfigure?: (nodeId: string, nodeType: string) => void;
}

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ data, selected, id }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Delete node:', id);
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onConfigure) {
      data.onConfigure(id, data.nodeType);
    }
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-secondary-500 !border-2 !border-white"
      />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[220px] max-w-[280px] transition-all',
          selected
            ? 'border-secondary-500 shadow-glow-secondary ring-2 ring-secondary-200'
            : 'border-neutral-200 hover:border-secondary-300',
          !data.isValid && 'border-warning-400'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-secondary-100">
              <GitBranch className="w-4 h-4 text-secondary-600" />
            </div>
            <span className="font-semibold text-sm text-neutral-900">
              {data.label}
            </span>
          </div>
          
          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered || selected ? 1 : 0, scale: isHovered || selected ? 1 : 0.8 }}
            className="flex items-center gap-1"
          >
            <button
              onClick={handleConfigure}
              className="p-1 rounded hover:bg-neutral-100 transition-colors"
              title="Configure"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-600" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-red-100 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
            </button>
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="text-xs text-neutral-600 line-clamp-2 mb-2">
          {data.condition || 'Click to set condition...'}
        </div>

        {/* Branch Labels */}
        <div className="flex items-center justify-between text-xs text-neutral-500 mt-3 pt-2 border-t border-neutral-100">
          <span className="text-success-600 font-medium">✓ True</span>
          <span className="text-danger-600 font-medium">✗ False</span>
        </div>

        {/* Validation Indicator */}
        {!data.isValid && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded mt-2"
          >
            <span className="font-medium">⚠</span>
            <span>Configuration required</span>
          </motion.div>
        )}
      </motion.div>
      
      {/* Multiple output handles for branching */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '30%' }}
        className="!w-3 !h-3 !bg-success-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '70%' }}
        className="!w-3 !h-3 !bg-danger-500 !border-2 !border-white"
      />
    </>
  );
};

export default ConditionNode;
