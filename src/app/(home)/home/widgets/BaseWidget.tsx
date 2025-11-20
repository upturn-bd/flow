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
