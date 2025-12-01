"use client";

import { motion } from "framer-motion";
import { ReactNode, ComponentType, isValidElement } from "react";
import { Button } from "./button";

// Match Phosphor's IconWeight type for better compatibility
type IconWeight = "regular" | "thin" | "light" | "bold" | "fill" | "duotone";

interface EmptyStateProps {
  /** Icon - can be a Phosphor icon component, any component, or a ReactNode */
  icon: ComponentType<{ size?: number; weight?: IconWeight; className?: string }> | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = "" 
}: EmptyStateProps) {
  // Handle both component types and ReactNode
  const renderIcon = () => {
    // Check if it's already a rendered React element
    if (isValidElement(icon)) {
      return icon;
    }
    // Check if it's a component (function or ForwardRef)
    // ForwardRef components have $$typeof Symbol but are still callable
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
      const IconComponent = icon as ComponentType<{ size?: number; weight?: IconWeight }>;
      return <IconComponent size={32} weight="duotone" />;
    }
    return icon;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-16 h-16 bg-background-secondary dark:bg-background-tertiary rounded-full flex items-center justify-center mb-4"
      >
        <div className="text-foreground-tertiary text-2xl">
          {renderIcon()}
        </div>
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground-primary mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-foreground-secondary mb-6 max-w-md"
      >
        {description}
      </motion.p>
      
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
          type="button"
            onClick={action.onClick}
            variant="primary"
            className="flex items-center gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
