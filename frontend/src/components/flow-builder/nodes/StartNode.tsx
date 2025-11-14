import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StartNodeData {
  label: string;
  nodeType: string;
}

const StartNode: React.FC<NodeProps<StartNodeData>> = ({ data, selected }) => {
  return (
    <>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'px-6 py-4 rounded-full border-2 bg-gradient-to-br from-success-400 to-success-600 shadow-lg transition-all',
          selected
            ? 'border-success-700 shadow-glow ring-4 ring-success-200'
            : 'border-success-500'
        )}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Play className="w-5 h-5 text-white fill-white" />
          </motion.div>
          <span className="font-bold text-sm text-white">
            {data.label}
          </span>
        </div>
      </motion.div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-success-600 !border-2 !border-white"
      />
    </>
  );
};

export default StartNode;
