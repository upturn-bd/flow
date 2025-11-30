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
        <label className="block font-medium text-foreground-secondary mb-1 text-sm sm:text-base">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          className={`
            w-full rounded-lg border-border-secondary border p-2.5 
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
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
