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
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Selected items display */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`min-h-[42px] w-full px-4 py-2 border rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
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
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(optionValue);
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-400 text-sm">{placeholder}</span>
              )}
            </div>
            <CaretDown
              className={`text-gray-400 transition-transform flex-shrink-0 ${
                isOpen ? "rotate-180" : ""
              }`}
              size={20}
            />
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className={isSelected ? "text-blue-700 font-medium" : "text-gray-700"}>
                      {option.label}
                    </span>
                    {isSelected && <Check className="text-blue-700" size={16} />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">No options available</div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {selectedLabels.length > 0 && (
        <p className="text-xs text-gray-500">{selectedLabels.length} selected</p>
      )}
    </div>
  );
}
