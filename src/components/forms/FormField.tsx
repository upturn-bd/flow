"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  containerClassName?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, icon, error, required, className = "", containerClassName = "", ...props }, ref) => {
    return (
      <div className={containerClassName}>
        <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-lg border-gray-300 border p-2.5 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-all shadow-sm text-sm sm:text-base
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export default FormField;
