"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

type FormInputFieldProps = {
  name: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  readOnly?: boolean;
  error?: string;
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
}: FormInputFieldProps) {
  const hasError = !!error;
  
  return (
    <div className="mb-4">
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
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          readOnly={readOnly}
          className={`w-full pl-10 pr-4 py-2.5 text-gray-900 rounded-lg border ${
            hasError 
              ? "border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50" 
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-[#EAF4FF]"
          } ${readOnly ? "bg-gray-100 cursor-not-allowed" : ""} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
        />
        {hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle size={16} />
          </div>
        )}
      </div>
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 