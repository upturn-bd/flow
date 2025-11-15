'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WidgetProps } from '@/lib/types/widgets';
import { cn } from '@/components/ui/class';

interface BaseWidgetProps extends WidgetProps {
  children: React.ReactNode;
  className?: string;
}

export default function BaseWidget({
  config,
  isEditMode = false,
  children,
  className,
}: BaseWidgetProps) {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-1',
    large: 'col-span-1 md:col-span-2',
    full: 'col-span-1 md:col-span-2 lg:col-span-3',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        sizeClasses[config.size],
        'relative',
        className
      )}
    >
      {isEditMode && (
        <div className="absolute -top-2 -right-2 z-10 bg-white rounded-full shadow-md p-1 cursor-move">
          <div className="w-6 h-6 flex items-center justify-center text-gray-400">
            ⋮⋮
          </div>
        </div>
      )}
      {children}
    </motion.div>
  );
}
