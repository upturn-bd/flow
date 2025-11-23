'use client';

import React from 'react';
import { IconType } from '@/lib/icons';

interface SectionHeaderProps {
  title: string;
  icon: IconType;
  iconColor?: string;
}

export default function SectionHeader({ 
  title, 
  icon: Icon, 
  iconColor = "text-primary-600" 
}: SectionHeaderProps) {
  return (
    <h2 className="text-xl font-bold text-foreground-primary mb-4 flex items-center">
      <Icon size={20} weight="bold" className={`mr-2 ${iconColor}`} />
      {title}
    </h2>
  );
}
