"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/components/ui/class";

export interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  error?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  containerClassName?: string;
  variant?: 'default' | 'card';
}

const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ 
    label, 
    description, 
    error, 
    checked,
    onChange,
    containerClassName,
    variant = 'default',
    className,
    disabled,
    ...props 
  }, ref) => {
    if (variant === 'card') {
      return (
        <label className={cn(
          "flex items-start gap-3 p-3 border border-border-primary rounded-xl hover:bg-surface-hover cursor-pointer transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-error",
          containerClassName
        )}>
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={cn(
              "w-4 h-4 mt-0.5 text-primary-600 border-border-primary rounded focus:ring-primary-500 focus:ring-2",
              "bg-surface-primary dark:bg-surface-secondary",
              disabled && "cursor-not-allowed",
              className
            )}
            {...props}
          />
          <div className="flex-1 min-w-0">
            {label && (
              <span className="text-sm font-medium text-foreground-primary">{label}</span>
            )}
            {description && (
              <p className="text-xs text-foreground-tertiary mt-0.5">{description}</p>
            )}
            {error && (
              <p className="text-xs text-error mt-1">{error}</p>
            )}
          </div>
        </label>
      );
    }

    return (
      <div className={cn("flex items-start gap-2", containerClassName)}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "w-4 h-4 mt-0.5 text-primary-600 border-border-primary rounded focus:ring-primary-500 focus:ring-2",
            "bg-surface-primary dark:bg-surface-secondary",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          {...props}
        />
        <div className="flex-1 min-w-0">
          {label && (
            <label 
              htmlFor={props.id}
              className={cn(
                "text-sm font-medium text-foreground-primary cursor-pointer",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn(
              "text-xs text-foreground-tertiary mt-0.5",
              disabled && "opacity-50"
            )}>
              {description}
            </p>
          )}
          {error && (
            <p className="text-xs text-error mt-1">{error}</p>
          )}
        </div>
      </div>
    );
  }
);

CheckboxField.displayName = "CheckboxField";

export default CheckboxField;
