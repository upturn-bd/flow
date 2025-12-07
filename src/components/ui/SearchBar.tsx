"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { forwardRef, InputHTMLAttributes } from "react";

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  withContainer?: boolean;
  showClearButton?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    input: "pl-9 pr-8 py-2 text-sm",
    iconSize: 16,
    iconLeft: "left-2.5",
    clearRight: "right-2",
  },
  md: {
    input: "pl-10 pr-10 py-2.5 text-sm",
    iconSize: 20,
    iconLeft: "left-3",
    clearRight: "right-3",
  },
  lg: {
    input: "pl-12 pr-12 py-3 text-base",
    iconSize: 24,
    iconLeft: "left-4",
    clearRight: "right-4",
  },
};

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      placeholder = "Search...",
      className = "",
      containerClassName = "",
      withContainer = false,
      showClearButton = true,
      size = "md",
      ...props
    },
    ref
  ) => {
    const sizes = sizeClasses[size];

    const inputElement = (
      <div className={`relative ${containerClassName}`}>
        <MagnifyingGlass
          size={sizes.iconSize}
          className={`absolute ${sizes.iconLeft} top-1/2 transform -translate-y-1/2 text-foreground-tertiary pointer-events-none`}
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full
            ${sizes.input}
            bg-surface-primary
            border border-border-primary
            rounded-lg
            text-foreground-primary
            placeholder:text-foreground-tertiary
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
        {showClearButton && value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={() => onChange("")}
            className={`absolute ${sizes.clearRight} top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-surface-hover text-foreground-tertiary hover:text-foreground-secondary transition-colors`}
          >
            <X size={sizes.iconSize - 4} />
          </motion.button>
        )}
      </div>
    );

    if (withContainer) {
      return (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-4">
          {inputElement}
        </div>
      );
    }

    return inputElement;
  }
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
