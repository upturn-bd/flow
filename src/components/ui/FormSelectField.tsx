"use client";

import React from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
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
        className="block text-sm font-semibold text-gray-700 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <select
          id={name}
          name={name}
          value={value === null ? "null" : value}
          onChange={onChange}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`w-full pl-10 pr-10 py-2.5 text-gray-900 rounded-lg border appearance-none shadow-sm ${
            hasError 
              ? "border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50" 
              : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white"
          } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200`}
        >
          <option value={"null"}>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={16} />
        </div>
        {hasError && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-500"
          >
            <AlertCircle size={16} />
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
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}