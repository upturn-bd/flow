'use client';

import React from 'react';
import { WidgetProps } from '@/lib/types/widgets';
import { cn } from '@/components/ui/class';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const {
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: config.id, 
    disabled: !isEditMode,
    animateLayoutChanges: () => false, // Disable layout animations
  });

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
