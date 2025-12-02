"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, CaretDown } from "@/lib/icons";

export interface DropdownOption {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
}

export default function MultiSelectDropdown({
  value = [],
  onChange,
  options,
  placeholder = "Select options",
  required = false,
  error,
  label,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const getSelectedLabels = () => {
    return options
      .filter((opt) => value.includes(opt.value))
      .map((opt) => opt.label);
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div className="space-y-2" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground-primary dark:text-foreground-primary">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Selected items display */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`min-h-[42px] w-full px-4 py-2 border rounded-lg cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary dark:bg-surface-primary ${
            error ? "border-error" : "border-border-primary dark:border-border-primary"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 flex-1 min-h-[24px]">
              {selectedLabels.length > 0 ? (
                selectedLabels.map((label, index) => {
                  const optionValue = options.find((opt) => opt.label === label)?.value || "";
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(optionValue);
                        }}
                        className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-foreground-tertiary dark:text-foreground-tertiary text-sm">{placeholder}</span>
              )}
            </div>
            <CaretDown
              className={`text-foreground-tertiary dark:text-foreground-tertiary transition-transform flex-shrink-0 ${
                isOpen ? "rotate-180" : ""
              }`}
              size={20}
            />
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-surface-primary dark:bg-surface-primary border border-border-primary dark:border-border-primary rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-surface-hover dark:hover:bg-surface-hover ${
                      isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""
                    }`}
                  >
                    <span className={isSelected ? "text-primary-700 dark:text-primary-300 font-medium" : "text-foreground-primary dark:text-foreground-primary"}>
                      {option.label}
                    </span>
                    {isSelected && <Check className="text-primary-700 dark:text-primary-300" size={16} />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-2 text-sm text-foreground-tertiary dark:text-foreground-tertiary">No options available</div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {selectedLabels.length > 0 && (
        <p className="text-xs text-foreground-tertiary dark:text-foreground-tertiary">{selectedLabels.length} selected</p>
      )}
    </div>
  );
}
