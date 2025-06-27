"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  containerClassName?: string;
}

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, required, className = "", containerClassName = "", ...props }, ref) => {
    return (
      <div className={containerClassName}>
        <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          className={`
            w-full rounded-lg border-gray-300 border p-2.5 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all shadow-sm text-sm sm:text-base resize-vertical
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

TextAreaField.displayName = "TextAreaField";

export default TextAreaField;
