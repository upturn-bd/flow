'use client';

import React from 'react';
import { IconType } from '@/lib/icons';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: IconType;
  message: string;
  iconSize?: number;
}

export default function EmptyState({ 
  icon: Icon, 
  message, 
  iconSize = 40 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-full min-h-[120px] text-foreground-secondary"
    >
      <Icon size={iconSize} weight="duotone" className="text-foreground-tertiary opacity-50 mb-3" />
      <p className="text-sm text-center px-4">{message}</p>
    </motion.div>
  );
}
