"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";
import { useProjects } from "@/hooks/useProjects";
import { useMilestones } from "@/hooks/useMilestones";
import { AlertCircle, Building2, X } from "lucide-react";
import ProjectForm, { type ProjectDetails } from "./ProjectForm";
import MilestoneList from "./milestone/MilestoneList";
import MilestoneForm, { type Milestone } from "./milestone/MilestoneForm";
import { supabase } from "@/lib/supabase/client";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";

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
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-gray-600" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold text-gray-800">Create New Project</h2>
        </div>
      </motion.div>
      
      {errors.submit && (
        <motion.div
          variants={fadeInUp}
          className="bg-red-50 border border-red-200 p-4 rounded-md mb-4"
        >
          <p className="text-red-700 flex items-center">
            <AlertCircle size={16} className="mr-2" strokeWidth={2} />
            {errors.submit}
          </p>
        </motion.div>
      )}

      {errors.milestone_weightage && (
        <motion.div
          variants={fadeInUp}
          className="bg-red-50 border border-red-200 p-4 rounded-md mb-4"
        >
          <p className="text-red-700 flex items-center">
            <AlertCircle size={16} className="mr-2" strokeWidth={2} />
            {errors.milestone_weightage}
          </p>
        </motion.div>
      )}

      <motion.div variants={fadeInUp}>
        <ProjectForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          departments={departments}
          employees={employees}
          mode="create"
        />
      </motion.div>

      <motion.div variants={fadeInUp}>
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
      </motion.div>

      {isCreatingMilestone && (
        <MilestoneForm
          milestone={milestone}
          onSubmit={handleAddMilestone}
          onCancel={() => setIsCreatingMilestone(false)}
          employees={employees}
          currentMilestones={milestones}
          mode="create"
          isSubmitting={isSubmitting}
        />
      )}

      {selectedMilestone && (
        <MilestoneForm
          milestone={milestone}
          onSubmit={handleUpdateMilestone}
          onCancel={() => setSelectedMilestone(null)}
          employees={employees}
          currentMilestones={milestones.filter((m) => m.project_id !== selectedMilestone)}
          mode="edit"
          isSubmitting={isSubmitting}
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
  const { departments } = useDepartments();
  const { employees } = useEmployeeInfo();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProjectDetails) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-gray-600" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold text-gray-800">Update Project</h2>
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
        >
          <X size={20} strokeWidth={2} />
        </Button>
      </motion.div>

      <motion.div variants={fadeInUp}>
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
    </motion.div>
  );
} 