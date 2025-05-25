"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText,
  Target,
  Building2,
  UserCircle,
  Calendar,
  Check,
  X,
} from "lucide-react";
import { projectSchema } from "@/lib/types";
import { z } from "zod";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";
import AssigneeSelect from "./AssigneeSelect";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export type ProjectDetails = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: ProjectDetails;
  onSubmit: (data: ProjectDetails) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  departments: { id: number; name: string }[];
  employees: { id: string; name: string }[];
  mode: 'create' | 'edit';
}

const initialProjectDetails: ProjectDetails = {
  project_title: "",
  start_date: "",
  description: "",
  goal: "",
  end_date: "",
  project_lead_id: "",
  department_id: 0,
  status: "Ongoing",
  assignees: [],
};

export default function ProjectForm({
  initialData = initialProjectDetails,
  onSubmit,
  onCancel,
  isSubmitting,
  departments,
  employees,
  mode,
}: ProjectFormProps) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "department_id") {
      setProjectDetails((prev) => ({ ...prev, [name]: Number(value) }));
    } else if (name === "start_date" || name === "end_date") {
      setProjectDetails((prev) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else {
      setProjectDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddAssignee = (id: string) => {
    setProjectDetails((prev) => ({
      ...prev,
      assignees: [...(prev.assignees || []), id],
    }));
  };

  const handleRemoveAssignee = (id: string) => {
    setProjectDetails((prev) => ({
      ...prev,
      assignees: (prev.assignees || []).filter((a) => a !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(projectDetails);
  };

  useEffect(() => {
    const result = projectSchema.safeParse(projectDetails);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
    }
  }, [projectDetails]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FormInputField
          name="project_title"
          label="Project Name"
          icon={<FileText size={16} className="text-blue-500" />}
          value={projectDetails.project_title || ""}
          onChange={handleInputChange}
          error={errors.project_title}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          onChange={handleInputChange}
          value={projectDetails.description}
          className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FormInputField
          name="goal"
          label="Goal"
          icon={<Target size={16} className="text-blue-500" />}
          value={projectDetails.goal || ""}
          onChange={handleInputChange}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <FormSelectField
            name="department_id"
            label="Department"
            icon={<Building2 size={16} className="text-blue-500" />}
            value={projectDetails.department_id ? projectDetails.department_id.toString() : null}
            onChange={handleInputChange}
            error={errors.department_id}
            options={departments.map(dept => ({
              value: dept.id.toString(),
              label: dept.name
            }))}
            placeholder="Select Department"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <FormSelectField
            name="project_lead_id"
            label="Project Lead"
            icon={<UserCircle size={16} className="text-blue-500" />}
            value={projectDetails.project_lead_id || null}
            onChange={handleInputChange}
            error={errors.project_lead_id}
            options={employees.map(emp => ({
              value: emp.id,
              label: emp.name
            }))}
            placeholder="Select Project Lead"
          />
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <FormInputField
            name="start_date"
            label="Start Date"
            icon={<Calendar size={16} className="text-blue-500" />}
            type="date"
            value={projectDetails.start_date || ""}
            onChange={handleInputChange}
            error={errors.start_date}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <FormInputField
            name="end_date"
            label="End Date"
            icon={<Calendar size={16} className="text-blue-500" />}
            type="date"
            value={projectDetails.end_date || ""}
            onChange={handleInputChange}
            error={errors.end_date}
            readOnly={!projectDetails.start_date}
          />
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <AssigneeSelect
          employees={employees}
          selectedAssignees={projectDetails.assignees || []}
          onAddAssignee={handleAddAssignee}
          onRemoveAssignee={handleRemoveAssignee}
          excludeIds={[projectDetails.project_lead_id || ""]}
        />
      </motion.div>
      
      <div className="flex justify-end gap-4 mt-8">
        {onCancel && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isSubmitting}
            onClick={onCancel}
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors duration-150 flex items-center"
          >
            <X size={16} className="mr-2" />
            Cancel
          </motion.button>
        )}
        
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={!isValid || isSubmitting}
          className={`bg-blue-600 text-white py-2 px-5 rounded-md font-medium shadow-sm flex items-center transition-all duration-150 ${
            !isValid || isSubmitting 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>
              <Check size={16} className="mr-2" />
              {mode === 'create' ? 'Create Project' : 'Update Project'}
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
} 