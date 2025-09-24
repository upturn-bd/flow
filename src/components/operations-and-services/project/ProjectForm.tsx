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
  AlertCircle,
} from "lucide-react";
import {
  validateProject,
  validationErrorsToObject,
} from "@/lib/utils/validation";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";
import AssigneeSelect from "./AssigneeSelect";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Project } from "@/lib/types/schemas";
import { Milestone } from "./milestone/MilestoneForm";
import MilestoneList from "./milestone/MilestoneList";
import MilestoneForm from "./milestone/MilestoneForm";
import { useMilestones } from "@/hooks/useMilestones";
import { MilestoneUpdateModal } from "./milestone";
import { fadeInUp } from "@/components/ui/animations";

export type ProjectDetails = Project;

interface ProjectFormProps {
  initialData?: ProjectDetails;
  initialMilestone?: Milestone;
  onSubmit: (data: ProjectDetails, milestones: Milestone[]) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  departments: { id: number; name: string }[];
  employees: { id: string; name: string }[];
  mode: "create" | "edit";
  initialMilestones?: Milestone[];
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
  initialMilestones,
  onSubmit,
  onCancel,
  isSubmitting,
  departments,
  employees,
  mode,
}: ProjectFormProps) {
  const [projectDetails, setProjectDetails] =
    useState<ProjectDetails>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({}); // track touched fields


  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const { fetchProjectMilestones, updateMilestone } = useMilestones();

  const getTotalMilestoneWeightage = () => {
    return milestones.reduce((sum, m) => sum + m.weightage, 0);
  }

  const initialMilestone: Milestone = {
    milestone_title: "",
    description: "",
    start_date: "",
    end_date: "",
    weightage: 100 - getTotalMilestoneWeightage(),
    status: "Not Started",
    project_id: initialData.id || 0,
    assignees: [],
  };

  // milestone state
  const [milestone, setMilestone] = useState<Milestone>(initialMilestone);

  useEffect(() => {
    const fetchMilestones = async () => {
      const projectMilestones = await fetchProjectMilestones(initialData.id || 0);
      console.log(projectMilestones)
      if (projectMilestones) {
        setMilestones(projectMilestones);
      }
    };

    fetchMilestones();
  }, [initialData.id]);


  const handleAddMilestoneClick = () => {
    setMilestone({
      milestone_title: "",
      description: "",
      start_date: "",
      end_date: "",
      weightage: Math.max(1, 100 - getTotalMilestoneWeightage()),
      status: "Not Started",
      project_id: initialData.id || 0,
      assignees: [],
    });
    setIsCreatingMilestone(true);
  };


  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // mark as touched
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "department_id") {
      setProjectDetails((prev: ProjectDetails) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else if (name === "start_date" || name === "end_date") {
      setProjectDetails((prev: ProjectDetails) => ({
        ...prev,
        [name]: new Date(value).toLocaleDateString("sv-SE"),
      }));
    } else {
      setProjectDetails((prev: ProjectDetails) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddAssignee = (id: string) => {
    setProjectDetails((prev: ProjectDetails) => ({
      ...prev,
      assignees: [...(prev.assignees || []), id],
    }));
  };

  const handleRemoveAssignee = (id: string) => {
    setProjectDetails((prev: ProjectDetails) => ({
      ...prev,
      assignees: (prev.assignees || []).filter((a: string) => a !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // mark all fields as touched on submit
    const allFields = Object.keys(projectDetails);
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])));

    // check milestone weightage
    if (milestones.length > 0) {
      const totalWeightage = milestones.reduce(
        (sum, m) => sum + m.weightage,
        0
      );
      if (totalWeightage !== 100) {
        setErrors({
          milestone_weightage: "Total milestone weightage must equal 100%",
        });
        return;
      }
      console.log(totalWeightage)
    }

    // validate before submit
    const result = validateProject(projectDetails);
    if (!result.success) {
      setErrors(validationErrorsToObject(result.errors));
      return;
    }

    onSubmit(projectDetails, milestones);


  };

  useEffect(() => {
    const result = validateProject(projectDetails);

    setErrors((prevErrors) => {
      const fieldErrors: Record<string, string> = {};

      if (!result.success) {
        const newErrors = validationErrorsToObject(result.errors);
        // only keep errors for touched fields
        for (const key in newErrors) {
          if (touched[key]) {
            fieldErrors[key] = newErrors[key];
          }
        }
      }

      // preserve non-field errors
      const nonFieldErrors = Object.fromEntries(
        Object.entries(prevErrors).filter(
          ([key]) => key === "milestone_weightage"
        )
      );

      return { ...fieldErrors, ...nonFieldErrors };
    });

    setIsValid(result.success);
  }, [projectDetails, touched]);


  const handleAddMilestone = (newMilestone: Milestone) => {
    const projectId = initialData.id || 0; // use existing project ID if editing
    setMilestones((prev) => [
      ...prev,
      { ...newMilestone, project_id: projectId },
    ]);
    setIsCreatingMilestone(false);
  };


  const handleUpdateMilestone = async (updatedMilestone: Milestone) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === updatedMilestone.id ? updatedMilestone : m))
    );

    await updateMilestone(updatedMilestone.id || 0, updatedMilestone);

    setSelectedMilestone(null);
  };


  const handleDeleteMilestone = (milestone_title: string) => {
    setMilestones((prev) => prev.filter((m) => m.milestone_title !== milestone_title));
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={(e) => {
      const target = e.target as HTMLElement;
      if (e.key === "Enter" && target.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    }} className="space-y-6 relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}

      {/* errors */}


      {/* Project fields */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FormInputField
          name="project_title"
          label="Project Name"
          icon={<FileText size={16} className="text-gray-500" />}
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
          className={`p-3 w-full h-32 rounded-md border-2  bg-white
    ${errors.description
              ? "border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
              : "border-gray-200"
            }
    focus:ring-blue-500 focus:border-blue-500 focus:outline-none
  `}
        />


        {errors.description && (
          <motion.p
            id={`${name}-error`}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mt-1 text-sm text-red-600"
          >
            {errors.description}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FormInputField
          name="goal"
          label="Goal"
          icon={<Target size={16} className="text-gray-500" />}
          value={projectDetails.goal || ""}
          onChange={handleInputChange}
          error={errors.goal}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSelectField
          name="department_id"
          label="Department"
          icon={<Building2 size={16} className="text-gray-500" />}
          value={
            projectDetails.department_id
              ? projectDetails.department_id.toString()
              : null
          }
          onChange={handleInputChange}
          error={errors.department_id}
          options={departments.map((dept) => ({
            value: dept.id.toString(),
            label: dept.name,
          }))}
          placeholder="Select Department"
        />

        <FormSelectField
          name="project_lead_id"
          label="Project Lead"
          icon={<UserCircle size={16} className="text-gray-500" />}
          value={projectDetails.project_lead_id || null}
          onChange={handleInputChange}
          error={errors.project_lead_id}
          options={employees.map((emp) => ({
            value: emp.id,
            label: emp.name,
          }))}
          placeholder="Select Project Lead"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInputField
          name="start_date"
          label="Start Date"
          icon={<Calendar size={16} className="text-gray-500" />}
          type="date"
          value={projectDetails.start_date || ""}
          onChange={handleInputChange}
          error={errors.start_date}
        />

        <FormInputField
          name="end_date"
          label="End Date"
          icon={<Calendar size={16} className="text-gray-500" />}
          type="date"
          value={projectDetails.end_date || ""}
          onChange={handleInputChange}
          error={errors.end_date}
          readOnly={!projectDetails.start_date}
          min={projectDetails.start_date || ""}
        />
      </div>

      <AssigneeSelect
        employees={employees}
        selectedAssignees={projectDetails.assignees || []}
        onAddAssignee={handleAddAssignee}
        onRemoveAssignee={handleRemoveAssignee}
        excludeIds={[projectDetails.project_lead_id || ""]}
      />

      {/* Milestones */}
      <MilestoneList
        milestones={milestones}
        onEdit={(milestone_title) => {
          console.log(milestones)
          const milestoneToUpdate = milestones.find((m) => m.milestone_title === milestone_title);
          if (milestoneToUpdate) {
            setSelectedMilestone(milestoneToUpdate);
          }
        }}

        onDelete={handleDeleteMilestone}
        onAdd={handleAddMilestoneClick}
        employees={employees}
      />


      {isCreatingMilestone && (
        <MilestoneForm
          milestone={milestone}
          onSubmit={handleAddMilestone}
          onCancel={() => setIsCreatingMilestone(false)}
          employees={employees}
          currentMilestones={milestones}
          currentWeightage={getTotalMilestoneWeightage()}
          mode="create"
          isSubmitting={isSubmitting}
        />
      )}

      {selectedMilestone && (
        <MilestoneUpdateModal
          initialData={selectedMilestone}
          onSubmit={handleUpdateMilestone}
          onClose={() => setSelectedMilestone(null)}
          currentTotalWeightage={getTotalMilestoneWeightage()}
        />
      )}

      {errors.milestone_weightage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
          <p className="text-red-700 flex items-center">
            {errors.milestone_weightage}
          </p>
        </div>
      )}

      {/* Submit */}
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
          disabled={isSubmitting}
          className={`bg-gray-800 text-white py-2 px-5 rounded-md font-medium shadow-sm flex items-center transition-all duration-150 ${isSubmitting
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-900 active:bg-gray-950"
            }`}
        >
          <Check size={16} className="mr-2" />
          {mode === "create" ? "Create Project" : "Update Project"}

        </motion.button>
      </div>
    </form>
  );
}
