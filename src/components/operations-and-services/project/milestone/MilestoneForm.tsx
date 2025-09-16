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
  Target,
} from "lucide-react";
import { Milestone } from "@/lib/types/schemas";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export type { Milestone };

interface MilestoneFormProps {
  milestone: Milestone;
  isSubmitting: boolean;
  onSubmit: (milestone: Milestone) => void;
  onCancel: () => void;
  employees: { id: string; name: string }[];
  currentMilestones: Milestone[];
  mode: "create" | "edit";
}

export const validateMilestone = (
  milestone: Milestone,
  currentMilestones: Milestone[]
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!milestone.milestone_title) errors.milestone_title = "Title is required";
  if (!milestone.start_date) errors.start_date = "Start date is required";
  if (!milestone.end_date) errors.end_date = "End date is required";
  if (!milestone.status) errors.status = "Status is required";
  if (!milestone.weightage) errors.weightage = "Weightage is required";

  if (milestone.start_date && milestone.end_date) {
    const start = new Date(milestone.start_date);
    const end = new Date(milestone.end_date);
    if (end < start) {
      errors.end_date = "End date must be after start date";
    }
  }

  const totalExistingWeightage = currentMilestones
    .filter((m) => m.milestone_title !== milestone.milestone_title)
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
  mode,
}: MilestoneFormProps) {
  const [milestoneData, setMilestoneData] = useState<Milestone>(milestone);
  const [milestoneAssignees, setMilestoneAssignees] = useState<string[]>(
    milestone.assignees || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setMilestoneData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === "weightage") {
      setMilestoneData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : 0,
      }));
    } else {
      setMilestoneData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !milestoneAssignees.includes(emp.id)
  );

  const handleAddAssignee = (id: string) => {
    setMilestoneAssignees((prev) => [...prev, id]);
    setSearchTerm("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveAssignee = (id: string) => {
    setMilestoneAssignees((prev) => prev.filter((a) => a !== id));
  };

  const handleSubmit = () => {
    const validationErrors = validateMilestone(
      { ...milestoneData, assignees: milestoneAssignees },
      currentMilestones
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    milestoneData.status = "Not Started"; // Default status for new milestones

    onSubmit({ ...milestoneData, assignees: milestoneAssignees });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto relative shadow-xl"
      >
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <Target size={24} className="text-gray-600" strokeWidth={2} />
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "create" ? "Add Milestone" : "Update Milestone"}
          </h2>
        </div>

        {/* removed <form>, replaced with <div> */}
        <div className="space-y-4">
          <FormInputField
            name="milestone_title"
            label="Milestone Title"
            icon={<Target size={16} className="text-gray-500" strokeWidth={2} />}
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
              className="w-full h-32 rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInputField
              name="start_date"
              label="Start Date"
              type="date"
              icon={<Calendar size={16} className="text-gray-500" strokeWidth={2} />}
              value={milestoneData.start_date || ""}
              onChange={handleChange}
              error={errors.start_date}
            />

            <FormInputField
              name="end_date"
              label="End Date"
              type="date"
              icon={<Calendar size={16} className="text-gray-500" strokeWidth={2} />}
              value={milestoneData.end_date || ""}
              onChange={handleChange}
              error={errors.end_date}
            />
          </div>

          {/* <FormSelectField
            name="status"
            label="Status"
            icon={<Target size={16} className="text-gray-500" strokeWidth={2} />}
            value={milestoneData.status || ""}
            onChange={handleChange}
            error={errors.status}
            options={[
              { value: "Not Started", label: "Not Started" },
              { value: "In Progress", label: "In Progress" },
              { value: "Completed", label: "Completed" },
            ]}
            placeholder="Select status"
          /> */}

          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Target size={14} className="text-gray-500" strokeWidth={2} />
              Weightage (%)
            </label>
            <input
              name="weightage"
              type="number"
              onChange={handleChange}
              value={milestoneData.weightage?.toString() || ""}
              min="1"
              max={
                100 -
                currentMilestones
                  .filter((m) => m.project_id !== milestoneData.project_id)
                  .reduce((sum, m) => sum + m.weightage, 0)
              }
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.weightage && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" strokeWidth={2} />
                {errors.weightage}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Users size={14} className="text-gray-500" strokeWidth={2} />
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
                {milestoneAssignees.map((assignee) => {
                  const emp = employees.find((e) => e.id === assignee);
                  return (
                    <motion.span
                      key={assignee}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {emp?.name}
                      <button
                        type="button"
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        onClick={() => handleRemoveAssignee(assignee)}
                      >
                        <X size={14} strokeWidth={2} />
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
              className="flex items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-150 shadow-sm"
              onClick={onCancel}
            >
              <X size={16} className="mr-2" strokeWidth={2} />
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleSubmit}
              className="flex items-center px-4 py-2 bg-gray-800 rounded-md text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-150 shadow-sm"
            >
              <Check size={16} className="mr-2" strokeWidth={2} />
              {mode === "create" ? "Add Milestone" : "Update Milestone"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
