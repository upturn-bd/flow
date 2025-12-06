import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass as MagnifyingGlass, X, Check } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { matchesEmployeeSearch } from '@/lib/utils/user-search';
import { Employee } from '@/lib/types/schemas';

interface AssigneeFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  employees: Employee[];
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  maxAssignees?: number;
}

export default function AssigneeField({
  value: assignees,
  onChange: setAssignees,
  employees,
  label = "Assignees",
  error,
  disabled = false,
  placeholder = "Search and select assignees...",
  maxAssignees
}: AssigneeFieldProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // FunnelSimple employees based on search term and exclude already selected
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = matchesEmployeeSearch(employee, searchTerm);
    const notSelected = !assignees.includes(employee.id.toString());
    return matchesSearch && notSelected;
  });

  const getSelectedEmployees = () => {
    return employees.filter(employee => assignees.includes(employee.id.toString()));
  };

  const handleEmployeeSelect = (employee: Employee) => {
    if (maxAssignees && assignees.length >= maxAssignees) {
      return;
    }
    
    const newAssignees = [...assignees, employee.id.toString()];
    setAssignees(newAssignees);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleEmployeeRemove = (employeeId: string) => {
    const newAssignees = assignees.filter(id => id !== employeeId);
    setAssignees(newAssignees);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay closing to allow for dropdown clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setIsDropdownOpen(false);
      }
    }, 150);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEmployees = getSelectedEmployees();

  return (
    <div className="space-y-2">
      <label className="block font-semibold text-foreground-secondary mb-2">
        {label}
        {maxAssignees && (
          <span className="text-sm font-normal text-foreground-tertiary ml-2">
            ({assignees.length}/{maxAssignees})
          </span>
        )}
      </label>

      {/* Selected Assignees */}
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedEmployees.map((employee) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              <span>{employee.name}</span>
              <button
                type="button"
                onClick={() => handleEmployeeRemove(employee.id.toString())}
                disabled={disabled}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-tertiary dark:text-foreground-tertiary" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled || (maxAssignees ? assignees.length >= maxAssignees : false)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors bg-surface-primary dark:bg-surface-primary text-foreground-primary dark:text-foreground-primary ${
              error ? 'border-red-300' : 'border-border-primary dark:border-border-primary'
            } ${disabled ? 'bg-background-secondary dark:bg-background-secondary cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && filteredEmployees.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-surface-primary dark:bg-surface-primary border border-border-primary dark:border-border-primary rounded-lg shadow-lg max-h-60 overflow-auto"
            >
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleEmployeeSelect(employee)}
                  className="w-full px-4 py-3 text-left hover:bg-surface-hover dark:hover:bg-surface-hover focus:bg-surface-hover dark:focus:bg-surface-hover focus:outline-none transition-colors flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground-primary dark:text-foreground-primary">{employee.name}</div>
                    {employee.email && (
                      <div className="text-sm text-foreground-secondary dark:text-foreground-secondary">{employee.email}</div>
                    )}
                    {employee.designation && (
                      <div className="text-xs text-foreground-tertiary dark:text-foreground-tertiary">{employee.designation}</div>
                    )}
                  </div>
                  <Check size={16} className="text-green-600" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}

      {maxAssignees && assignees.length >= maxAssignees && (
        <p className="text-amber-600 text-sm mt-1">
          Maximum number of assignees reached
        </p>
      )}
    </div>
  );
}
