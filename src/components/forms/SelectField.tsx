"use client";

import { forwardRef, SelectHTMLAttributes } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
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
        {label && (
          <label className="block font-medium text-foreground-primary mb-1 text-sm sm:text-base">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full rounded-lg border border-border-primary bg-surface-primary text-foreground-primary p-2.5 
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none
            transition-all shadow-sm text-sm sm:text-base
            ${error ? 'border-error focus:ring-error' : ''}
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
          <p className="text-error text-xs sm:text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";

export default SelectField;
