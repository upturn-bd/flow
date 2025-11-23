import React from "react";
import { motion } from "framer-motion";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "pending" | "complete";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  iconColorClass?: string;
  text?: string;
}

const variantClasses = {
  primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-sm dark:bg-primary-500 dark:hover:bg-primary-600",
  secondary: "bg-surface-secondary hover:bg-surface-hover text-foreground-primary shadow-sm border border-border-primary",
  outline: "border border-border-primary hover:bg-surface-hover text-foreground-primary shadow-sm",
  ghost: "hover:bg-surface-hover text-foreground-primary",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm dark:bg-red-500 dark:hover:bg-red-600",
  pending: "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 shadow-sm dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-400",
  complete: "bg-green-100 hover:bg-green-200 text-green-700 shadow-sm dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400",
};

const sizeClasses = {
  sm: "text-xs px-2 py-1 rounded",
  md: "text-sm px-4 py-2 rounded-md",
  lg: "text-base px-6 py-3 rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      disabled,
      children,
      text="",
      iconColorClass = "",
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
        className={`
          font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? "w-full" : ""}
          ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>

            {children}
          </div>
        ) : (
          <>
            {children}
          </>
        )}
      </motion.button>
    );
  }
);