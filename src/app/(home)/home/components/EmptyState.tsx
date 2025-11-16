'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/components/ui/animations';

interface EmptyStateProps {
  icon: LucideIcon;
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
      variants={fadeIn}
      className="flex flex-col items-center justify-center h-full min-h-[120px] text-gray-500"
    >
      <Icon size={iconSize} className="text-gray-300 mb-3" />
      <p className="text-sm text-center px-4">{message}</p>
    </motion.div>
  );
}
