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
          'relative px-8 py-5 rounded-2xl border-2 shadow-2xl transition-all overflow-hidden',
          'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600',
          selected
            ? 'border-emerald-300 ring-4 ring-emerald-200/50'
            : 'border-emerald-400/50'
        )}
        style={{
          boxShadow: selected
            ? '0 20px 40px -12px rgba(16, 185, 129, 0.5), 0 0 0 4px rgba(16, 185, 129, 0.1)'
            : '0 10px 30px -8px rgba(16, 185, 129, 0.4)',
        }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Content */}
        <div className="relative flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Play className="w-4 h-4 text-white fill-white" />
          </motion.div>
          <span className="font-bold text-base text-white drop-shadow-md">
            {data.label}
          </span>
        </div>

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
          style={{
            transform: 'skewX(-20deg)',
          }}
        />
      </motion.div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !shadow-lg"
      />
    </>
  );
};

export default StartNode;
