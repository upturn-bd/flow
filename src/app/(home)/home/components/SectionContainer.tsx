'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SectionContainerProps {
  children: React.ReactNode;
  variants: any;
  className?: string;
}

export default function SectionContainer({ 
  children, 
  variants, 
  className = "mb-8" 
}: SectionContainerProps) {
  return (
    <motion.section 
      variants={variants}
      className={className}
    >
      {children}
    </motion.section>
  );
}
