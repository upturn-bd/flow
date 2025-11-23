"use client";

import React from "react";
import { WarningCircle } from "@/lib/icons";
import { motion } from "framer-motion";
import { fadeInUp } from "./animations";

type FormInputFieldProps = {
  name: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  readOnly?: boolean;
  error?: string;
  min?: string;
};

export default function FormInputField({
  name,
  label,
  icon,
  value,
  onChange,
  type = "text",
  readOnly = false,
  error,
  min,
}: FormInputFieldProps) {
  const hasError = !!error;
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block text-sm font-semibold text-foreground-primary mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-tertiary">
          {icon}
        </div>
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          readOnly={readOnly}
          aria-invalid={hasError}
          min={min}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`w-full pl-10 pr-4 py-2.5 text-foreground-primary rounded-lg border shadow-sm ${
            hasError 
              ? "border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/20 dark:border-red-700" 
              : "border-border-primary focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
          } ${readOnly ? "bg-surface-secondary cursor-not-allowed" : ""} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200`}
        />
        {hasError && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
          >
            <WarningCircle size={16} weight="fill" />
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
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}