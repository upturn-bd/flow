"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Users } from "lucide-react";

interface AssigneeSelectProps {
  employees: { id: string; name: string }[];
  selectedAssignees: string[];
  onAddAssignee: (id: string) => void;
  onRemoveAssignee: (id: string) => void;
  excludeIds?: string[];
}

export default function AssigneeSelect({
  employees,
  selectedAssignees,
  onAddAssignee,
  onRemoveAssignee,
  excludeIds = [],
}: AssigneeSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedAssignees.includes(emp.id) &&
      !excludeIds.includes(emp.id)
  );

  const handleAddAssignee = (id: string) => {
    onAddAssignee(id);
    setSearchTerm("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
        <Users size={16} className="text-gray-500" strokeWidth={2} />
        Assignees
      </label>

      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
          placeholder="Search for assignees..."
          className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3 pr-10"
        />
        <Search 
          size={16} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          strokeWidth={2}
        />

        <AnimatePresence>
          {dropdownOpen && filteredEmployees.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredEmployees.map((emp) => (
                <motion.li
                  key={emp.id}
                  onClick={() => handleAddAssignee(emp.id)}
                  whileHover={{ backgroundColor: "#f3f4f6" }}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                >
                  {emp.name}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        <AnimatePresence>
          {selectedAssignees.map((assignee) => {
            const emp = employees.find((e) => e.id === assignee);
            return emp ? (
              <motion.span
                key={assignee}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {emp.name}
                <button
                  type="button"
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => onRemoveAssignee(assignee)}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </motion.span>
            ) : null;
          })}
        </AnimatePresence>
      </div>
    </div>
  );
} 