'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WidgetProps, WidgetSize } from '@/lib/types/widgets';
import { cn } from '@/components/ui/class';
import { Eye, EyeOff, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
    overIndex,
  } = useSortable({ 
    id: config.id, 
    disabled: !isEditMode,
    animateLayoutChanges: () => false, // Disable layout animations
  });

  // Debug logging
  React.useEffect(() => {
    if (isEditMode) {
      console.log('Widget in edit mode:', config.id, { hasListeners: !!listeners });
    }
  }, [isEditMode, config.id, listeners]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
  };

  const handleSizeToggle = () => {
    if (!onSizeChange) return;
    
    const sizeOrder: WidgetSize[] = ['medium', 'large', 'medium'];
    const currentIndex = sizeOrder.indexOf(config.size);
    const nextSize = sizeOrder[(currentIndex + 1) % sizeOrder.length];
    onSizeChange(nextSize);
  };

  // Don't render if disabled and not in edit mode
  if (!config.enabled && !isEditMode) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'h-full w-full',
        'relative',
        !config.enabled && isEditMode && 'opacity-50',
        isDragging && 'opacity-30 scale-95',
        'transition-all duration-200',
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

      {/* Drag handle */}
      {isEditMode && config.enabled && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -top-3 -left-3 z-10 p-2 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-md transition-colors cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
          type="button"
        >
          <GripVertical size={16} />
        </button>
      )}
      
      {/* Widget content - always show the container */}
      <div className={cn(
        'h-full w-full overflow-hidden',
        !config.enabled && !isEditMode && 'hidden'
      )}>
        {children}
      </div>
    </div>
  );
}
