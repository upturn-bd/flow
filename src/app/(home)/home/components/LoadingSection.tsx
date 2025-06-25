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
    <div className="py-8 flex justify-center">
      <LoadingSpinner text={text} color={color} icon={icon} />
    </div>
  );
}
