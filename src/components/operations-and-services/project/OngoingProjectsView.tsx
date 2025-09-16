"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import { useEffect, useState } from "react";
import ProjectDetails from "./ProjectDetails";
import CreateNewProjectPage, { UpdateProjectPage } from "./CreateNewProject";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ProjectCard from "./ProjectCard";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { EmptyState } from "@/components/ui/EmptyState";

const emptyProject: Project = {
  project_title: "",
  start_date: "",
  end_date: "",
  project_lead_id: "",
  status: "Ongoing",
  description: "",
  assignees: [],
};

function ProjectsList() {
  const { projects, loading, fetchProjects, updateProject, deleteProject } =
    useProjects();
  const [projectDetailsId, setProjectDetailsId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const {
    employees,
    fetchEmployees,
    loading: employeesLoading,
  } = useEmployees();
  const {
    departments,
    fetchDepartments,
    loading: departmentsLoading,
  } = useDepartments();

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchDepartments();
  }, [fetchProjects, fetchEmployees, fetchDepartments]);

  const handleUpdateProject = async (values: any) => {
    try {
      if (selectedProject?.id) {
        await updateProject(selectedProject.id, values);
        toast.success("Project updated successfully");
        setSelectedProject(null);
        // fetchProjects(); // Removed: useProjects hook handles state update automatically
      }
    } catch (error) {
      toast.error("Error updating project");
      console.error(error);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await deleteProject(id);
      toast.success("Project deleted successfully");
      // fetchProjects(); // Removed: useProjects hook handles state update automatically
    } catch (error) {
      toast.error("Error deleting project");
      console.error(error);
    }
  };

  if (loading || employeesLoading || departmentsLoading) {
    return (
      <LoadingSection
        icon={Building2}
        text="Loading projects..."
        color="blue"
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!selectedProject && !projectDetailsId && (
        <motion.div
          key="content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="px-4 space-y-6 py-4"
        >
          <motion.div
            variants={fadeInUp}
            className="flex items-center gap-3 mb-4"
          >
            <Building2 size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Ongoing Projects
            </h1>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <AnimatePresence>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project, idx) =>
                    typeof project.id !== "undefined" ? (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={() => setSelectedProject(project)}
                        onDelete={() =>
                          handleDeleteProject(project.id as number)
                        }
                        onDetails={() =>
                          setProjectDetailsId(project.id as number)
                        }
                        employees={employees}
                        departments={
                          departments.filter((d) => d.id != null) as any
                        }
                        showEdit={true}
                        showDelete={true}
                        showDetails={true}
                      />
                    ) : null
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={<Building2 className="h-12 w-12" />}
                  title="No ongoing projects found"
                  description="Create new projects to get started and track your work"
                  action={{
                    label: "Create Project",
                    onClick: () => setSelectedProject(emptyProject),
                    icon: <Plus size={16} />,
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* {projects.length > 0 && (
            <motion.div variants={fadeIn} className="flex justify-end mt-4">
              <Button
                onClick={() => setSelectedProject(emptyProject)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add Project
              </Button>
            </motion.div>
          )} */}
        </motion.div>
      )}

      {!selectedProject && projectDetailsId && (
        <ProjectDetails
          id={projectDetailsId}
          employees={employees}
          departments={departments}
          onClose={() => setProjectDetailsId(null)}
          onSubmit={handleUpdateProject}
        />
      )}

      {!projectDetailsId && selectedProject && (
        <UpdateProjectPage
          initialData={selectedProject}
          employees={employees}
          departments={departments}
          onSubmit={handleUpdateProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </AnimatePresence>
  );
}

export default ProjectsList;
