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
        <label className="block font-medium text-foreground-primary mb-1 text-sm sm:text-base">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          className={`
            w-full rounded-lg border border-border-primary bg-surface-primary text-foreground-primary p-2.5 
            placeholder:text-foreground-tertiary
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none
            transition-all shadow-sm text-sm sm:text-base resize-vertical
            ${error ? 'border-error focus:ring-error' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-error text-xs sm:text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

TextAreaField.displayName = "TextAreaField";

export default TextAreaField;
