'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import LoadingSpinner, {ColorType} from '@/components/ui/LoadingSpinner';


interface LoadingSectionProps {
  text: string;
  icon: LucideIcon;
  color?: ColorType;
}

export default function LoadingSection({ 
  text, 
  icon, 
  color = "blue"
}: LoadingSectionProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px]">
      <LoadingSpinner text={text} color={color} icon={icon} />
    </div>
  );
}
