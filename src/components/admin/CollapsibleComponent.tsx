'use client';

import { CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

export default function Collapsible({ title, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(true); // Start open so data is immediately visible

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="flex w-full items-center justify-between p-4 text-left text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-inset"
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
      >
        <span className="text-xl font-semibold text-gray-800">{title}</span>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 text-gray-600"
        >
          <CaretDown weight="bold" className="h-5 w-5" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={isOpen ? "visible" : "hidden"}
        className="overflow-hidden bg-gray-200 border-t border-gray-200"
      >
        <div className="p-4">{children}</div>
      </motion.div>
    </div>
  );
}
