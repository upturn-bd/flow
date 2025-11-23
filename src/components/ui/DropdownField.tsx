"use client";

import { CaretDown } from "@/lib/icons";

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
}

export default function DropdownField({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  error,
  label,
}: DropdownFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 pr-10 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <CaretDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={20}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
