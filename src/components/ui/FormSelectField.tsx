"use client";

import React from "react";
import { WarningCircle, CaretDown } from "@/lib/icons";
import { motion } from "framer-motion";
import { fadeInUp } from "./animations";

type SelectOption = {
  value: string | number;
  label: string;
};

type FormSelectFieldProps = {
  name: string;
  label?: string;
  icon: React.ReactNode;
  options: SelectOption[];
  placeholder: string;
  value: string | number | null;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
};

export default function FormSelectField({
  name,
  label,
  icon,
  options,
  placeholder,
  value,
  onChange,
  error,
}: FormSelectFieldProps) {
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
        <select
          id={name}
          name={name}
          value={value === null ? "null" : value}
          onChange={onChange}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`w-full pl-10 pr-10 py-2.5 text-foreground-primary rounded-lg border appearance-none shadow-sm ${
            hasError 
              ? "border-error ring-1 ring-error focus:ring-error focus:border-error bg-error/5" 
              : "border-border-primary focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
          } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200`}
        >
          <option value={"null"}>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-tertiary pointer-events-none">
          <CaretDown size={16} weight="bold" />
        </div>
        {hasError && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-error"
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
          className="mt-1 text-sm text-error"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}