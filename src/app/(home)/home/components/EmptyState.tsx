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
      className="flex flex-col items-center justify-center py-10 text-gray-500"
    >
      <Icon size={iconSize} className="text-gray-300 mb-3" />
      <p>{message}</p>
    </motion.div>
  );
}
