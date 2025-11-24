"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useDepartmentsContext, useEmployeesContext, useProjectsContext } from "@/contexts";
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
  project_id: "",
  assignees: [],
};

const initialProjectDetails: ProjectDetails = {
  project_title: "",
  start_date: "",
  description: "",
  goal: "",
  end_date: "",
  project_lead_id: "",
  department_ids: [],
  status: "Ongoing",
  assignees: [],
};

export default function CreateNewProjectPage({ setActiveTab }: { setActiveTab: (key: string) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments } = useDepartmentsContext();
  const { employees, fetchEmployees } = useEmployeesContext();
  const { createProject } = useProjectsContext();
  const { createMilestone } = useMilestones();

  useEffect(() => {
    // Departments auto-fetched by context
    fetchEmployees();
  }, []);

  const handleSubmit = async (
    data: ProjectDetails,
    milestones: any[]
  ) => {
    setIsSubmitting(true);

    try {
      console.log("Step 1", data)
      const projectResult = await createProject({ ...data });
      console.log("Step 3", projectResult)
      if (!projectResult.success) {
        throw new Error("Failed to create project");
      }

      let projectId: string | undefined;
      if (projectResult.data) {
        if (
          Array.isArray(projectResult.data) &&
          projectResult.data.length > 0
        ) {
          projectId = projectResult.data[0].id;
        } else if (
          typeof projectResult.data === "object" &&
          "id" in projectResult.data
        ) {
          projectId = projectResult.data.id;
        }
      }
      if (!projectId) {
        throw new Error("Project ID not returned after creation");
      }

      // Create milestones if provided
      if (milestones.length > 0) {
        for (const m of milestones) {
          const milestoneToCreate = { ...m, project_id: projectId };
          const milestoneResult = await createMilestone(milestoneToCreate);
          if (!milestoneResult.success) {
            await supabase.from("project_records").delete().match({ id: projectId });
            throw new Error("Failed to create milestones", { cause: milestoneResult.error });
          }
        }
      }

      toast.success("Project created successfully!");

      setActiveTab('ongoing')
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
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
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-gray-600" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold text-gray-800">
            Create New Project
          </h2>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <ProjectForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          departments={
            departments.filter((d) => d.id != null) as {
              id: number;
              name: string;
            }[]
          }
          mode="create"
        />
      </motion.div>
    </motion.div>
  );
}
export function UpdateProjectPage({
  initialData,
  employees,
  departments,
  onSubmit,
  onClose,
}: {
  initialData: ProjectDetails;
  employees: { id: string; name: string }[];
  departments: Department[];
  onSubmit: (data: ProjectDetails) => void;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createMilestone , updateMilestone} = useMilestones()

  const handleSubmit = async (data: ProjectDetails, milestones: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);

      const projectId = data.id;

      if (milestones.length > 0) {
        for (const m of milestones) {
          const milestoneToCreate = { ...m, project_id: projectId };
          if (m.id) {
            const milestoneResult = await updateMilestone(m.id, milestoneToCreate)
          } else {
            const milestoneResult = await createMilestone(milestoneToCreate);
            if (!milestoneResult.success) {
              await supabase.from("project_records").delete().match({ id: projectId });
              throw new Error("Failed to create milestones", { cause: milestoneResult.error });
            }
          }

        }
      }
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
          departments={departments.filter(d => d.id != null) as { id: number; name: string }[]}
          mode="edit"
        />
      </motion.div>
    </motion.div>
  );
} 