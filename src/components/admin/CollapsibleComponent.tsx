'use client';

import { CaretDown } from '@/lib/icons';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

export default function Collapsible({ title, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(true); // Start open so data is immediately visible

  return (
    <div className="w-full rounded-xl border border-border-primary bg-background-secondary shadow-sm overflow-hidden">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="flex w-full items-center justify-between p-4 text-left text-foreground-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 focus:ring-inset"
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
      >
        <span className="text-xl font-semibold text-foreground-primary">{title}</span>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-background-tertiary text-foreground-secondary"
        >
          <CaretDown weight="bold" className="h-5 w-5" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={isOpen ? "visible" : "hidden"}
        className="overflow-hidden bg-background-secondary border-t border-border-primary"
      >
        <div className="p-4">{children}</div>
      </motion.div>
    </div>
  );
}
