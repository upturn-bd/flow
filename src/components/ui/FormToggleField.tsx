"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "./animations";

type FormToggleFieldProps = {
  name: string;
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  description?: string;
};

export default function FormToggleField({
  name,
  label,
  icon,
  checked,
  onChange,
  disabled = false,
  error,
  description,
}: FormToggleFieldProps) {
  const hasError = !!error;

  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block text-sm font-semibold text-foreground-primary dark:text-foreground-primary mb-2"
      >
        {label}
      </label>
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        hasError 
          ? "border-error bg-error/5" 
          : "border-border-primary dark:border-border-primary bg-background-secondary dark:bg-background-secondary"
      }`}>
        <div className="text-foreground-tertiary dark:text-foreground-tertiary">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              {description && (
                <p className="text-sm text-foreground-secondary dark:text-foreground-secondary">{description}</p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={checked}
              aria-labelledby={name}
              disabled={disabled}
              onClick={() => onChange(!checked)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors duration-200 ease-in-out focus:outline-none 
                focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                ${checked ? 'bg-primary-600' : 'bg-background-tertiary dark:bg-background-tertiary'}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <span
                aria-hidden="true"
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-surface-primary 
                  shadow-lg ring-0 transition-transform duration-200 ease-in-out
                  ${checked ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
      </div>
      {hasError && (
        <motion.p
          id={`${name}-error`}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="mt-1 text-sm text-error"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
