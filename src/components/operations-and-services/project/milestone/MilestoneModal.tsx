"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  Target,
  Search,
  X,
  Check,
} from "lucide-react";
import { Milestone } from "@/hooks/useMilestones";
import { useEmployees } from "@/hooks/useEmployees";
import { milestoneSchema } from "@/lib/types";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface MilestoneCreateModalProps {
  currentTotalWeightage: number;
  projectId: number;
  onSubmit: (values: Milestone) => void;
  onClose: () => void;
}

interface MilestoneUpdateModalProps {
  currentTotalWeightage: number;
  initialData: Milestone;
  onSubmit: (values: Milestone) => void;
  onClose: () => void;
}

const initialMilestone: Milestone = {
  milestone_title: "",
  description: "",
  start_date: "",
  end_date: "",
  weightage: 0,
  status: "",
  project_id: undefined,
  assignees: [],
};

export default function MilestoneCreateModal({
  currentTotalWeightage,
  projectId,
  onSubmit,
  onClose,
}: MilestoneCreateModalProps) {
  const { employees, fetchEmployees } = useEmployees();
  const [milestone, setMilestone] = useState<Milestone>(initialMilestone);
  const [milestoneAssignees, setMilestoneAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMilestoneValid, setIsMilestoneValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = milestoneSchema.safeParse(milestone);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = String(issue.path[0]);
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    const company_id = await getCompanyId();
    const formattedData = {
      ...result.data,
      company_id,
    };
    onSubmit(formattedData);
    setMilestone(initialMilestone);
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setMilestone((prev: Milestone) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "weightage") {
      setMilestone((prev: Milestone) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setMilestone((prev: Milestone) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const result = milestoneSchema.safeParse(milestone);
    if (result.success) {
      setIsMilestoneValid(true);
      setErrors({});
    } else {
      setIsMilestoneValid(false);
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = String(err.path[0]);
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
    }
  }, [milestone]);

  useEffect(() => {
    setMilestone((prev: Milestone) => ({
      ...prev,
      assignees: milestoneAssignees,
    }));
  }, [milestoneAssignees]);

  useEffect(() => {
    setMilestone((prev: Milestone) => ({
      ...prev,
      project_id: projectId,
    }));
  }, [projectId]);

  const [milestoneSearchTerm, setMilestoneSearchTerm] = useState("");
  const [isMilestoneDropdownOpen, setIsMilestoneDropdownOpen] = useState(false);
  const milestoneInputRef = useRef<HTMLInputElement>(null);
  const milestoneDropdownRef = useRef<HTMLDivElement>(null);

  const filteredMilestoneEmployees = employees.filter(
    (emp) =>
      !milestoneAssignees.includes(emp.id) &&
      emp.name.toLowerCase().includes(milestoneSearchTerm.toLowerCase())
  );

  const handleAddMilestoneAssignee = (id: string) => {
    setMilestoneAssignees((prev) => [...prev, id]);
    setMilestoneSearchTerm("");
    setIsMilestoneDropdownOpen(false);
    milestoneInputRef.current?.focus();
  };

  const handleRemoveMilestoneAssignee = (id: string) => {
    setMilestoneAssignees((prev) => prev.filter((a) => a !== id));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        milestoneDropdownRef.current &&
        !milestoneDropdownRef.current.contains(e.target as Node)
      ) {
        setIsMilestoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Target size={24} className="text-gray-600" strokeWidth={2} />
          <h2 className="text-xl font-semibold text-gray-900">Add Milestone</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Milestone Title
            </label>
            <input
              name="milestone_title"
              type="text"
              onChange={handleChange}
              value={milestone.milestone_title}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.milestone_title && (
              <p className="text-red-500 text-sm mt-1">{errors.milestone_title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              onChange={handleChange}
              value={milestone.description}
              className="w-full h-32 rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              onChange={handleChange}
              name="start_date"
              type="date"
              value={milestone.start_date}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              name="end_date"
              type="date"
              onChange={handleChange}
              value={milestone.end_date}
              min={
                milestone.start_date
                  ? new Date(new Date(milestone.start_date).getTime() + 86400000)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.end_date && (
              <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignees
            </label>

            <div className="relative" ref={milestoneDropdownRef}>
              <input
                type="text"
                ref={milestoneInputRef}
                value={milestoneSearchTerm}
                onChange={(e) => {
                  setMilestoneSearchTerm(e.target.value);
                  setIsMilestoneDropdownOpen(true);
                }}
                onFocus={() => setIsMilestoneDropdownOpen(true)}
                placeholder="Search for assignees..."
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3 pr-10"
              />
              <Search 
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />

              {isMilestoneDropdownOpen && filteredMilestoneEmployees.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredMilestoneEmployees.map((emp) => (
                    <motion.li
                      key={emp.id}
                      onClick={() => handleAddMilestoneAssignee(emp.id)}
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      className="cursor-pointer px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                    >
                      {emp.name}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
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
                      onClick={() => handleRemoveMilestoneAssignee(assignee)}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </motion.span>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                name="status"
                onChange={handleChange}
                value={milestone.status}
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3 appearance-none"
              >
                <option value="">Select status</option>
                {["Ongoing", "Completed", "Archived"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="fill-gray-400" width="10" height="6">
                  <path d="M0 0h10L5 6z" />
                </svg>
              </div>
            </div>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weightage
            </label>
            <input
              name="weightage"
              type="number"
              onChange={handleChange}
              value={milestone.weightage}
              max={100 - currentTotalWeightage}
              min={1}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.weightage && (
              <p className="text-red-500 text-sm mt-1">{errors.weightage}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="flex items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-150 shadow-sm"
            onClick={onClose}
          >
            <X size={16} className="mr-2" strokeWidth={2} />
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="flex items-center px-4 py-2 bg-gray-800 rounded-md text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isMilestoneValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" strokeWidth={2} />
                Save
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

export function MilestoneUpdateModal({
  currentTotalWeightage,
  initialData,
  onSubmit,
  onClose,
}: MilestoneUpdateModalProps) {
  const { employees, fetchEmployees } = useEmployees();
  const [milestone, setMilestone] = useState<Milestone>(initialMilestone);
  const [milestoneAssignees, setMilestoneAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMilestoneValid, setIsMilestoneValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = milestoneSchema.safeParse(milestone);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = String(issue.path[0]);
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setMilestone((prev: Milestone) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "weightage") {
      setMilestone((prev: Milestone) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setMilestone((prev: Milestone) => ({ ...prev, [name]: value }));
    }
    setIsDirty(true);
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const result = milestoneSchema.safeParse(milestone);
    if (result.success) {
      setIsMilestoneValid(true);
      setErrors({});
    } else {
      setIsMilestoneValid(false);
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = String(err.path[0]);
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
    }
  }, [milestone]);

  useEffect(() => {
    setMilestone(initialData);
    setMilestoneAssignees(initialData.assignees || []);
  }, [initialData]);

  useEffect(() => {
    setMilestone((prev: Milestone) => ({
      ...prev,
      assignees: milestoneAssignees,
    }));
  }, [milestoneAssignees]);

  const [milestoneSearchTerm, setMilestoneSearchTerm] = useState("");
  const [isMilestoneDropdownOpen, setIsMilestoneDropdownOpen] = useState(false);
  const milestoneInputRef = useRef<HTMLInputElement>(null);
  const milestoneDropdownRef = useRef<HTMLDivElement>(null);

  const filteredMilestoneEmployees = employees.filter(
    (emp) =>
      !milestoneAssignees.includes(emp.id) &&
      emp.name.toLowerCase().includes(milestoneSearchTerm.toLowerCase())
  );

  const handleAddMilestoneAssignee = (id: string) => {
    setMilestoneAssignees((prev) => [...prev, id]);
    setMilestoneSearchTerm("");
    setIsMilestoneDropdownOpen(false);
    milestoneInputRef.current?.focus();
  };

  const handleRemoveMilestoneAssignee = (id: string) => {
    setMilestoneAssignees((prev) => prev.filter((a) => a !== id));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        milestoneDropdownRef.current &&
        !milestoneDropdownRef.current.contains(e.target as Node)
      ) {
        setIsMilestoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Target size={24} className="text-gray-600" strokeWidth={2} />
          <h2 className="text-xl font-semibold text-gray-900">Update Milestone</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Milestone Title
            </label>
            <input
              name="milestone_title"
              type="text"
              onChange={handleChange}
              value={milestone.milestone_title}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.milestone_title && (
              <p className="text-red-500 text-sm mt-1">{errors.milestone_title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              onChange={handleChange}
              value={milestone.description}
              className="w-full h-32 rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              onChange={handleChange}
              name="start_date"
              type="date"
              value={milestone.start_date}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              name="end_date"
              type="date"
              onChange={handleChange}
              value={milestone.end_date}
              min={
                milestone.start_date
                  ? new Date(new Date(milestone.start_date).getTime() + 86400000)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.end_date && (
              <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignees
            </label>

            <div className="relative" ref={milestoneDropdownRef}>
              <input
                type="text"
                ref={milestoneInputRef}
                value={milestoneSearchTerm}
                onChange={(e) => {
                  setMilestoneSearchTerm(e.target.value);
                  setIsMilestoneDropdownOpen(true);
                }}
                onFocus={() => setIsMilestoneDropdownOpen(true)}
                placeholder="Search for assignees..."
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3 pr-10"
              />
              <Search 
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />

              {isMilestoneDropdownOpen && filteredMilestoneEmployees.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredMilestoneEmployees.map((emp) => (
                    <motion.li
                      key={emp.id}
                      onClick={() => handleAddMilestoneAssignee(emp.id)}
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      className="cursor-pointer px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                    >
                      {emp.name}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
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
                      onClick={() => handleRemoveMilestoneAssignee(assignee)}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </motion.span>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                name="status"
                onChange={handleChange}
                value={milestone.status}
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3 appearance-none"
              >
                <option value="">Select status</option>
                {["Ongoing", "Completed", "Archived"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="fill-gray-400" width="10" height="6">
                  <path d="M0 0h10L5 6z" />
                </svg>
              </div>
            </div>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weightage
            </label>
            <input
              name="weightage"
              type="number"
              onChange={handleChange}
              value={milestone.weightage}
              max={100 - currentTotalWeightage + initialData.weightage}
              min={1}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50 bg-gray-50 p-3"
            />
            {errors.weightage && (
              <p className="text-red-500 text-sm mt-1">{errors.weightage}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="flex items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-150 shadow-sm"
            onClick={onClose}
          >
            <X size={16} className="mr-2" strokeWidth={2} />
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="flex items-center px-4 py-2 bg-gray-800 rounded-md text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isMilestoneValid || isSubmitting || !isDirty}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" strokeWidth={2} />
                Update
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
