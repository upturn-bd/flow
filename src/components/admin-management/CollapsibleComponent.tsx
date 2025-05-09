'use client';

import { CaretDown } from '@phosphor-icons/react';
import { useState, useRef } from 'react';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

export default function Collapsible({ title, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-gray-200 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left text-gray-800 focus:outline-none"
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
      >
        <span className="text-xl font-bold">{title}</span>
        
        <CaretDown
          className={`h-5 w-5 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="collapsible-content"
        ref={contentRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen py-2' : 'max-h-0'
        }`}
      >
        <div className="text-sm text-gray-600">{children}</div>
      </div>
    </div>
  );
}
