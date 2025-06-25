'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
}

export default function SectionHeader({ 
  title, 
  icon: Icon, 
  iconColor = "text-blue-600" 
}: SectionHeaderProps) {
  return (
    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
      <Icon className={`mr-2 h-5 w-5 ${iconColor}`} />
      {title}
    </h2>
  );
}
