"use client";

import React from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/components/ui/animations";

type SelectOption = {
  value: string | number;
  label: string;
};

type FormSelectFieldProps = {
  name: string;
  label: string;
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

  console.log(options);
  
  return (
    <motion.div 
      variants={fadeInUp}
      className="mb-4"
    >
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 mb-1"
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
          className={`w-full pl-10 pr-10 py-2.5 text-gray-900 rounded-lg appearance-none ${
            hasError 
              ? "border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50" 
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-[#EAF4FF]"
          }`}
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
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle size={16} />
          </div>
        )}
      </div>
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </motion.div>
  );
} 