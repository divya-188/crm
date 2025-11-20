import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageNodeData {
  label: string;
  message?: string;
  nodeType: string;
  isValid?: boolean;
  onConfigure?: (nodeId: string, nodeType: string) => void;
}

const MessageNode: React.FC<NodeProps<MessageNodeData>> = ({ data, selected, id }) => {
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
        className="!w-2 !h-2 !bg-primary-500 !border-2 !border-white"
      />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border bg-white cursor-pointer hover:shadow-soft transition-all group',
          selected
            ? 'border-primary-500 shadow-soft ring-2 ring-primary-200'
            : 'border-neutral-200 hover:border-primary-300',
          !data.isValid && 'border-warning-400'
        )}
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: '#8b5cf6',
        }}
      >
        {/* Icon */}
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: '#8b5cf615',
          }}
        >
          <MessageSquare className="w-4 h-4" style={{ color: '#8b5cf6' }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-neutral-900 mb-0.5">
            {data.label}
          </h4>
          <p className="text-xs text-neutral-500 line-clamp-2">
            {data.message || 'Click to edit...'}
          </p>
          
          {/* Validation Indicator */}
          {!data.isValid && (
            <div className="flex items-center gap-1 text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded mt-2">
              <span>⚠</span>
              <span>Config</span>
            </div>
          )}
        </div>

        {/* Action Buttons - Only show on hover */}
        {(isHovered || selected) && (
          <div className="flex gap-1 flex-shrink-0">
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
          </div>
        )}
      </motion.div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-primary-500 !border-2 !border-white"
      />
    </>
  );
};

export default MessageNode;
