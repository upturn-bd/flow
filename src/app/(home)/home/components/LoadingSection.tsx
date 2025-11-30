'use client';

import React from 'react';
import { IconType } from '@/lib/icons';
import LoadingSpinner, {ColorType} from '@/components/ui/LoadingSpinner';


interface LoadingSectionProps {
  text: string;
  icon: IconType;
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
