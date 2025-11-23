import { Check, CaretDown, X } from "@/lib/icons";
import { forwardRef, useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";

export interface MultiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectFieldProps {
  options: MultiSelectOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  maxSelections?: number;
  searchable?: boolean;
}

export const MultiSelectField = forwardRef<HTMLDivElement, MultiSelectFieldProps>(
  ({ 
    options,
    value = [],
    onChange,
    placeholder = "Select options...",
    className = "",
    disabled = false,
    label,
    error,
    maxSelections,
    searchable = false,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = searchable ? 
      options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      ) : options;

    const selectedOptions = options.filter(option => value.includes(option.value));

    const handleToggleOption = (optionValue: string | number) => {
      if (value.includes(optionValue)) {
        onChange(value.filter(v => v !== optionValue));
      } else {
        if (maxSelections && value.length >= maxSelections) {
          return;
        }
        onChange([...value, optionValue]);
      }
    };

    const handleRemoveOption = (optionValue: string | number) => {
      onChange(value.filter(v => v !== optionValue));
    };

    const handleClearAll = () => {
      onChange([]);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className={`relative ${className}`} ref={ref} {...props}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div 
          ref={dropdownRef}
          className="relative"
        >
          {/* Selected values display */}
          <div
            className={`
              min-h-[40px] w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              cursor-pointer flex flex-wrap gap-1 items-center
              ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            {selectedOptions.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.map(option => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {option.label}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveOption(option.value);
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
                {selectedOptions.length > 0 && !disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAll();
                    }}
                    className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear all</span>
                  </Button>
                )}
              </>
            )}
            
            <CaretDown 
              className={`h-4 w-4 text-gray-400 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>

          {/* Dropdown */}
          {isOpen && !disabled && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {searchable && (
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              
              <div className="py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    {searchable && searchTerm ? 'No options found' : 'No options available'}
                  </div>
                ) : (
                  filteredOptions.map(option => {
                    const isSelected = value.includes(option.value);
                    const canSelect = !maxSelections || value.length < maxSelections || isSelected;
                    
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleToggleOption(option.value)}
                        disabled={option.disabled || (!canSelect && !isSelected)}
                        className={`
                          w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2
                          ${isSelected ? 'bg-blue-50 text-blue-700' : ''}
                          ${option.disabled || (!canSelect && !isSelected) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {option.label}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        
        {maxSelections && (
          <p className="mt-1 text-xs text-gray-500">
            {value.length}/{maxSelections} selected
          </p>
        )}
      </div>
    );
  }
);

MultiSelectField.displayName = "MultiSelectField";
