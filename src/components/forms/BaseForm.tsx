import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/components/ui/animations';

interface BaseFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
}

export const BaseForm: React.FC<BaseFormProps> = ({
  onSubmit,
  children,
  className = "",
  title,
  icon,
  isLoading = false,
  disabled = false,
}) => {
  return (
    <motion.form
      variants={fadeInUp}
      onSubmit={onSubmit}
      className={`space-y-4 ${className}`}
    >
      {title && (
        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
          {icon}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </motion.div>
      )}
      
      <fieldset disabled={disabled || isLoading}>
        {children}
      </fieldset>
    </motion.form>
  );
};

export default BaseForm;
