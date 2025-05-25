"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar,
  Users,
  Search,
  AlertCircle,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { milestoneSchema } from "@/lib/types";
import { z } from "zod";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export type Milestone = z.infer<typeof milestoneSchema>;

interface MilestoneFormProps {
  milestone: Milestone;
  isSubmitting: boolean;
  onSubmit: (milestone: Milestone) => void;
  onCancel: () => void;
  employees: { id: string; name: string }[];
  currentMilestones: Milestone[];
  mode: 'create' | 'edit';
}

export const validateMilestone = (milestone: Milestone, currentMilestones: Milestone[]): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Basic validation
  if (!milestone.milestone_title) errors.milestone_title = "Title is required";
  if (!milestone.start_date) errors.start_date = "Start date is required";
  if (!milestone.end_date) errors.end_date = "End date is required";
  if (!milestone.status) errors.status = "Status is required";
  if (!milestone.weightage) errors.weightage = "Weightage is required";

  // Date validation
  if (milestone.start_date && milestone.end_date) {
    const start = new Date(milestone.start_date);
    const end = new Date(milestone.end_date);
    if (end < start) {
      errors.end_date = "End date must be after start date";
    }
  }

  // Weightage validation
  const totalExistingWeightage = currentMilestones
    .filter(m => m.milestone_title !== milestone.milestone_title)
    .reduce((sum, m) => sum + m.weightage, 0);
  
  const remainingWeightage = 100 - totalExistingWeightage;
  
  if (milestone.weightage > remainingWeightage) {
    errors.weightage = `Weightage cannot exceed ${remainingWeightage}%`;
  }

  return errors;
};

export default function MilestoneForm({
  milestone,
  isSubmitting,
  onSubmit,
  onCancel,
  employees,
  currentMilestones,
  mode
}: MilestoneFormProps) {
  const [milestoneData, setMilestoneData] = useState<Milestone>(milestone);
  const [milestoneAssignees, setMilestoneAssignees] = useState<string[]>(milestone.assignees || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setMilestoneData(prev => ({
        ...prev,
        [name]: value, // Keep as string for date inputs
      }));
    } else if (name === "weightage") {
      setMilestoneData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : 0,
      }));
    } else {
      setMilestoneData(prev => ({ ...prev, [name]: value }));
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !milestoneAssignees.includes(emp.id)
  );

  const handleAddAssignee = (id: string) => {
    setMilestoneAssignees(prev => [...prev, id]);
    setSearchTerm("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveAssignee = (id: string) => {
    setMilestoneAssignees(prev => prev.filter(a => a !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateMilestone(
      { ...milestoneData, assignees: milestoneAssignees },
      currentMilestones
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit({ ...milestoneData, assignees: milestoneAssignees });
  };

  return (
    <motion.div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <motion.div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto relative">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        )}
        
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {mode === 'create' ? 'Add Milestone' : 'Update Milestone'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInputField
            name="milestone_title"
            label="Milestone Title"
            icon={<Calendar size={16} className="text-blue-500" />}
            value={milestoneData.milestone_title || ""}
            onChange={handleChange}
            error={errors.milestone_title}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              onChange={handleChange}
              value={milestoneData.description || ""}
              className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInputField
              name="start_date"
              label="Start Date"
              type="date"
              icon={<Calendar size={16} className="text-blue-500" />}
              value={milestoneData.start_date || ""}
              onChange={handleChange}
              error={errors.start_date}
            />

            <FormInputField
              name="end_date"
              label="End Date"
              type="date"
              icon={<Calendar size={16} className="text-blue-500" />}
              value={milestoneData.end_date || ""}
              onChange={handleChange}
              error={errors.end_date}
            />
          </div>

          <FormSelectField
            name="status"
            label="Status"
            icon={<Calendar size={16} className="text-blue-500" />}
            value={milestoneData.status || ""}
            onChange={handleChange}
            error={errors.status}
            options={[
              { value: "Ongoing", label: "Ongoing" },
              { value: "Completed", label: "Completed" },
              { value: "Archived", label: "Archived" }
            ]}
            placeholder="Select status"
          />

          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="text-blue-500" />
              Weightage (%)
            </label>
            <input
              name="weightage"
              type="number"
              onChange={handleChange}
              value={milestoneData.weightage?.toString() || ""}
              min="1"
              max={100 - currentMilestones
                .filter(m => m.project_id !== milestoneData.project_id)
                .reduce((sum, m) => sum + m.weightage, 0)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
            />
            {errors.weightage && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.weightage}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Users size={14} className="text-blue-500" />
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
                onBlur={() => setDropdownOpen(false)}
                placeholder="Search for assignees..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 pr-10"
              />
              <Search 
                size={16} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />

              <AnimatePresence>
                {dropdownOpen && filteredEmployees.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredEmployees.map((emp) => (
                      <motion.li
                        key={emp.id}
                        onClick={() => handleAddAssignee(emp.id)}
                        whileHover={{ backgroundColor: "#f3f4f6" }}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 text-sm"
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
                {milestoneAssignees.map((assignee) => {
                  const emp = employees.find((e) => e.id === assignee);
                  return (
                    <motion.span
                      key={assignee}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {emp?.name}
                      <button
                        type="button"
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => handleRemoveAssignee(assignee)}
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
              onClick={onCancel}
            >
              <X size={16} className="mr-2" />
              Cancel
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            >
              <Check size={16} className="mr-2" />
              {mode === 'create' ? 'Add Milestone' : 'Update Milestone'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 