'use client';

import React from 'react';
import { LockKey } from "@phosphor-icons/react";
import { motion } from 'framer-motion';
import { fadeInUp } from './animations';

interface NoPermissionMessageProps {
  moduleName?: string;
  message?: string;
}

export default function NoPermissionMessage({ 
  moduleName = 'this content',
  message 
}: NoPermissionMessageProps) {
  const defaultMessage = `You don't have permission to view ${moduleName}. Please contact your administrator if you need access.`;
  
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center p-8 text-center h-full"
    >
      <div className="bg-surface-secondary rounded-full p-4 mb-4">
        <LockKey size={32} weight="duotone" className="text-foreground-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground-primary mb-2">
        Access Restricted
      </h3>
      <p className="text-sm text-foreground-secondary max-w-md">
        {message || defaultMessage}
      </p>
    </motion.div>
  );
}
