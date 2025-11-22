import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass as Search, X, CaretDown, User } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { matchesEmployeeSearch } from '@/lib/utils/user-search';
import { Employee } from '@/lib/types/schemas';

interface SingleEmployeeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  employees: Employee[];
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export default function SingleEmployeeSelector({
  value: selectedEmployeeId,
  onChange: setSelectedEmployeeId,
  employees,
  label = "Employee",
  error,
  disabled = false,
  placeholder = "Search and select employee...",
  required = false
}: SingleEmployeeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    matchesEmployeeSearch(employee, searchTerm)
  );

  const getSelectedEmployee = () => {
    return employees.find(employee => employee.id.toString() === selectedEmployeeId);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployeeId(employee.id.toString());
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedEmployeeId("");
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleInputClick = () => {
    setIsDropdownOpen(true);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedEmployee = getSelectedEmployee();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected Employee Display / Search Input */}
        <div 
          className={`w-full border rounded-lg bg-white cursor-pointer ${
            error
              ? 'border-red-300 focus-within:ring-red-500 focus-within:border-red-500'
              : 'border-gray-300 focus-within:ring-purple-500 focus-within:border-purple-500'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          onClick={!disabled ? handleInputClick : undefined}
        >
          <div className="flex items-center p-3">
            <Search className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
            
            {selectedEmployee && !isDropdownOpen ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedEmployee.name}</p>
                    {selectedEmployee.email && (
                      <p className="text-xs text-gray-500">{selectedEmployee.email}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSelection();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 border-none focus:outline-none focus:ring-0 p-0 text-sm bg-transparent"
                  disabled={disabled}
                />
                <CaretDown className={`h-4 w-4 text-gray-400 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`} />
              </div>
            )}
          </div>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredEmployees.length > 0 ? (
                <div className="p-1">
                  {filteredEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleEmployeeSelect(employee)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
                        {employee.email && (
                          <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                        )}
                        {employee.designation && (
                          <p className="text-xs text-gray-400 truncate">{employee.designation}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees available'}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
