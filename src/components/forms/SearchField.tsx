import { Search, X } from "@/lib/icons";
import { forwardRef, useState } from "react";
import { Button } from "../ui/button";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  disabled?: boolean;
  showClearButton?: boolean;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "Search...", 
    className = "", 
    onClear,
    disabled = false,
    showClearButton = true,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      onChange("");
      onClear?.();
    };

    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={ref}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full pl-10 pr-10 py-2 
              border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors duration-200
              ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            `}
            {...props}
          />
          {showClearButton && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 h-6 w-6 p-0 -translate-y-1/2 hover:bg-gray-100"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>
    );
  }
);

SearchField.displayName = "SearchField";
