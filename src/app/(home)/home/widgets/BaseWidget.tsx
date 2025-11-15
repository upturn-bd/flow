'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WidgetProps, WidgetSize } from '@/lib/types/widgets';
import { cn } from '@/components/ui/class';
import { Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';

interface BaseWidgetProps extends WidgetProps {
  children: React.ReactNode;
  className?: string;
}

export default function BaseWidget({
  config,
  isEditMode = false,
  onToggle,
  onSizeChange,
  children,
  className,
}: BaseWidgetProps) {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-1',
    large: 'col-span-1 md:col-span-2',
    full: 'col-span-1 md:col-span-2 lg:col-span-3',
  };

  const handleSizeToggle = () => {
    if (!onSizeChange) return;
    
    const sizeOrder: WidgetSize[] = ['medium', 'large', 'medium'];
    const currentIndex = sizeOrder.indexOf(config.size);
    const nextSize = sizeOrder[(currentIndex + 1) % sizeOrder.length];
    onSizeChange(nextSize);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: config.enabled || isEditMode ? 1 : 0.5, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        sizeClasses[config.size],
        'relative',
        !config.enabled && isEditMode && 'opacity-50',
        className
      )}
    >
      {/* Edit mode controls */}
      {isEditMode && (
        <div className="absolute -top-3 -right-3 z-10 flex gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            className={cn(
              'p-2 rounded-full shadow-md transition-colors',
              config.enabled 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
            )}
            title={config.enabled ? 'Hide widget' : 'Show widget'}
          >
            {config.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
          </motion.button>
          {config.enabled && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSizeToggle}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md transition-colors"
              title={config.size === 'large' ? 'Make smaller' : 'Make larger'}
            >
              {config.size === 'large' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </motion.button>
          )}
        </div>
      )}
      
      {/* Widget content - always show the container */}
      <div className={cn(
        'h-full',
        !config.enabled && !isEditMode && 'hidden'
      )}>
        {children}
      </div>
    </motion.div>
  );
}
