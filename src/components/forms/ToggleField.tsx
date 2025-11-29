import { forwardRef } from "react";

export interface ToggleFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ToggleField = forwardRef<HTMLButtonElement, ToggleFieldProps>(
  ({ 
    checked,
    onChange,
    label,
    description,
    error,
    className = "",
    disabled = false,
    size = 'md',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-4',
      md: 'w-11 h-6',
      lg: 'w-14 h-7'
    };

    const thumbSizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    const translateClasses = {
      sm: checked ? 'translate-x-4' : 'translate-x-0.5',
      md: checked ? 'translate-x-5' : 'translate-x-0.5',
      lg: checked ? 'translate-x-7' : 'translate-x-0.5'
    };

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          className={`
            relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${sizeClasses[size]}
            ${checked 
              ? 'bg-primary-600 hover:bg-primary-700' 
              : 'bg-background-tertiary dark:bg-background-tertiary hover:bg-border-primary dark:hover:bg-border-secondary'
            }
            ${disabled 
              ? (checked ? 'bg-primary-400' : 'bg-background-secondary dark:bg-background-secondary') 
              : ''
            }
          `}
          {...props}
        >
          <span className="sr-only">
            {label || 'Toggle switch'}
          </span>
          <span
            className={`
              inline-block rounded-full bg-white dark:bg-surface-primary shadow-sm transition-transform duration-200 ease-in-out
              ${thumbSizeClasses[size]}
              ${translateClasses[size]}
            `}
          />
        </button>
        
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label 
                className={`
                  block text-sm font-medium cursor-pointer
                  ${disabled ? 'text-foreground-tertiary dark:text-foreground-tertiary' : 'text-foreground-primary dark:text-foreground-primary'}
                  ${error ? 'text-red-600' : ''}
                `}
                onClick={() => !disabled && onChange(!checked)}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`
                text-sm mt-1
                ${disabled ? 'text-foreground-tertiary dark:text-foreground-tertiary' : 'text-foreground-secondary dark:text-foreground-secondary'}
              `}>
                {description}
              </p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

ToggleField.displayName = "ToggleField";
