"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";
import { useProjects } from "@/hooks/useProjects";
import { useMilestones } from "@/hooks/useMilestones";
import { AlertCircle } from "lucide-react";
import ProjectForm, { type ProjectDetails } from "./ProjectForm";
import MilestoneList from "./milestone/MilestoneList";
import MilestoneForm, { type Milestone } from "./milestone/MilestoneForm";
import { supabase } from "@/lib/supabase/client";

const initialMilestone: Milestone = {
  milestone_title: "",
  description: "",
  start_date: "",
  end_date: "",
  weightage: 0,
  status: "",
  project_id: 1,
  assignees: [],
};

const initialProjectDetails: ProjectDetails = {
  project_title: "",
  start_date: "",
  description: "",
  goal: "",
  end_date: "",
  project_lead_id: "",
  department_id: undefined,
  status: "Ongoing",
  assignees: [],
};

export default function CreateNewProjectPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const { employees, fetchEmployeeInfo } = useEmployeeInfo();
  const { createProject } = useProjects();
  const { createMilestone } = useMilestones();
  const [milestone, setMilestone] = useState<Milestone>(initialMilestone);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);

  React.useEffect(() => {
    fetchDepartments();
    fetchEmployeeInfo();
  }, [fetchDepartments, fetchEmployeeInfo]);

  const handleSubmit = async (data: ProjectDetails) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate milestones if any
      if (milestones.length > 0) {
        const totalWeightage = milestones.reduce((sum, m) => sum + m.weightage, 0);
        if (totalWeightage !== 100) {
          setErrors({ milestone_weightage: "Total milestone weightage must equal 100%" });
          setIsSubmitting(false);
          return;
        }
      }

      // Create project using hook
      const projectResult = await createProject({ ...data });
      if (!projectResult.success) {
        throw new Error("Failed to create project");
      }
      let projectId: number | undefined;
      if (projectResult.data) {
        if (Array.isArray(projectResult.data) && projectResult.data.length > 0) {
          projectId = projectResult.data[0].id;
        } else if (typeof projectResult.data === 'object' && 'id' in projectResult.data) {
          projectId = projectResult.data.id;
        }
      }
      if (!projectId) {
        throw new Error("Project ID not returned after creation");
      }

      // Create milestones if any using hook
      if (milestones.length > 0) {
        for (const m of milestones) {
          const milestoneToCreate = { ...m, project_id: projectId };
          const milestoneResult = await createMilestone(milestoneToCreate);
          if (!milestoneResult.success) {
            // Rollback project creation
          await supabase
          .from("project_records")
          .delete()
            .match({ id: projectId });
            console.error("Failed to create milestones:", milestoneResult);
            throw new Error("Failed to create milestones");
          }
        }
      }

      // Reset form
      setMilestones([]);
      setMilestone(initialMilestone);
      toast.success("Project created successfully!");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create project");
      setErrors({ submit: "Failed to create project. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMilestone = (newMilestone: Milestone) => {
    setMilestones((prev) => [...prev, { ...newMilestone, project_id: prev.length + 1 }]);
    setIsCreatingMilestone(false);
  };

  const handleUpdateMilestone = (updatedMilestone: Milestone) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.project_id === selectedMilestone ? updatedMilestone : m
      )
    );
    setSelectedMilestone(null);
  };

  const handleDeleteMilestone = (id: number) => {
    setMilestones((prev) => prev.filter((m) => m.project_id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-2xl font-bold text-blue-800 mb-8"
      >
        Create New Project
      </motion.h1>
      
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 p-4 rounded-md mb-4"
        >
          <p className="text-red-700 flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {errors.submit}
          </p>
        </motion.div>
      )}

      {errors.milestone_weightage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 p-4 rounded-md mb-4"
        >
          <p className="text-red-700 flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {errors.milestone_weightage}
          </p>
        </motion.div>
      )}

      <ProjectForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        departments={departments}
        employees={employees}
        mode="create"
      />

      <MilestoneList
        milestones={milestones}
        onEdit={(id) => {
          const milestoneToUpdate = milestones.find((m) => m.project_id === id);
          if (milestoneToUpdate) {
            setMilestone(milestoneToUpdate);
            setSelectedMilestone(id);
          }
        }}
        onDelete={handleDeleteMilestone}
        onAdd={() => setIsCreatingMilestone(true)}
        employees={employees}
      />

      {isCreatingMilestone && (
        <MilestoneForm
          milestone={milestone}
          isSubmitting={isSubmitting}
          onSubmit={handleAddMilestone}
          onCancel={() => {
            setIsCreatingMilestone(false);
            setMilestone(initialMilestone);
          }}
          employees={employees}
          currentMilestones={milestones}
          mode="create"
        />
      )}

      {selectedMilestone && (
        <MilestoneForm
          milestone={milestone}
          isSubmitting={isSubmitting}
          onSubmit={handleUpdateMilestone}
          onCancel={() => {
            setSelectedMilestone(null);
            setMilestone(initialMilestone);
          }}
          employees={employees}
          currentMilestones={milestones}
          mode="edit"
        />
      )}
    </motion.div>
  );
}

export function UpdateProjectPage({
  initialData,
  onSubmit,
  onClose,
}: {
  initialData: ProjectDetails;
  onSubmit: (data: ProjectDetails) => void;
  onClose: () => void;
}) {
  const { departments, fetchDepartments } = useDepartments();
  const { employees, fetchEmployeeInfo } = useEmployeeInfo();
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    fetchDepartments();
    fetchEmployeeInfo();
  }, [fetchDepartments, fetchEmployeeInfo]);

  const handleSubmit = async (data: ProjectDetails) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-2xl font-bold text-blue-800 mb-8"
      >
        Update Project
      </motion.h1>

      <ProjectForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        departments={departments}
        employees={employees}
        mode="edit"
      />
    </motion.div>
  );
} 