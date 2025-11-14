import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EndNodeData {
  label: string;
  nodeType: string;
}

const EndNode: React.FC<NodeProps<EndNodeData>> = ({ data, selected }) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-danger-600 !border-2 !border-white"
      />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'px-6 py-4 rounded-full border-2 bg-gradient-to-br from-danger-400 to-danger-600 shadow-lg transition-all',
          selected
            ? 'border-danger-700 shadow-glow ring-4 ring-danger-200'
            : 'border-danger-500'
        )}
      >
        <div className="flex items-center gap-2">
          <X className="w-5 h-5 text-white" />
          <span className="font-bold text-sm text-white">
            {data.label}
          </span>
        </div>
      </motion.div>
    </>
  );
};

export default EndNode;
