"use client";

import React from "react";
import { WarningCircle } from "@/lib/icons";
import { motion } from "framer-motion";
import { fadeInUp } from "./animations";

type FormDateFieldProps = {
  name: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  error?: string;
  placeholder?: string;
  description?: string;
};

export default function FormDateField({
  name,
  label,
  icon,
  value,
  onChange,
  readOnly = false,
  error,
  placeholder,
  description,
}: FormDateFieldProps) {
  const hasError = !!error;
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block text-sm font-semibold text-foreground-primary dark:text-foreground-primary mb-1"
      >
        {label}
      </label>
      {description && (
        <p className="text-sm text-foreground-secondary dark:text-foreground-secondary mb-2">{description}</p>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-tertiary dark:text-foreground-tertiary">
          {icon}
        </div>
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          type="date"
          readOnly={readOnly}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`w-full pl-10 pr-4 py-2.5 text-foreground-primary dark:text-foreground-primary rounded-lg border shadow-sm ${
            hasError 
              ? "border-error ring-1 ring-error focus:ring-error focus:border-error bg-error/5" 
              : "border-border-primary dark:border-border-primary focus:ring-primary-500 focus:border-primary-500 bg-surface-primary dark:bg-surface-primary"
          } ${readOnly ? "bg-background-tertiary dark:bg-background-tertiary cursor-not-allowed" : ""} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200`}
        />
        {hasError && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-error"
          >
            <WarningCircle size={16} />
          </motion.div>
        )}
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
