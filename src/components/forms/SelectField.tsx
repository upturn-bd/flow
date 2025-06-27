"use client";

import { forwardRef, SelectHTMLAttributes } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ 
    label, 
    error, 
    required, 
    options, 
    placeholder, 
    className = "", 
    containerClassName = "", 
    ...props 
  }, ref) => {
    return (
      <div className={containerClassName}>
        <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          ref={ref}
          className={`
            w-full rounded-lg border-gray-300 border p-2.5 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all shadow-sm text-sm sm:text-base
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";

export default SelectField;
