import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/lib/icons';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-2 items-end">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        <Icons.user className="w-4 h-4 text-primary-600" />
      </div>

      {/* Typing Bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl rounded-bl-sm px-5 py-3 shadow-sm"
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-neutral-400 rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
