"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import { useEffect, useState } from "react";
import ProjectDetails from "./ProjectDetails";
import { UpdateProjectPage } from "./CreateNewProject";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Edit, Trash2, Clock, Calendar, Building2, User, Plus } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import ProjectCard from "./ProjectCard";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";

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
  const { employees } = useEmployees();
  const { departments } = useDepartments();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleUpdateProject = async (values: any) => {
    try {
      if (selectedProject?.id) {
        await updateProject(selectedProject.id, values);
        toast.success("Project updated successfully");
        setSelectedProject(null);
        fetchProjects();
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
      fetchProjects();
    } catch (error) {
      toast.error("Error deleting project");
      console.error(error);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingSpinner 
          icon={Building2} 
          text="Loading projects..." 
          height="h-screen" 
          color="gray" 
        />
      )}
      
      {!selectedProject && !projectDetailsId && !loading && (
        <motion.div
          key="content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="px-4 space-y-6 py-4"
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
            <Building2 size={22} className="text-gray-600" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-gray-800">Ongoing Projects</h3>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <AnimatePresence>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project, idx) => (
                    typeof project.id !== "undefined" ? (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={() => setSelectedProject(project)}
                        onDelete={() => handleDeleteProject(project.id as number)}
                        onDetails={() => setProjectDetailsId(project.id as number)}
                        employees={employees}
                        departments={departments.filter(d => d.id != null) as any}
                        showEdit={true}
                        showDelete={true}
                        showDetails={true}
                      />
                    ) : null
                  ))}
                </div>
              ) : (
                <motion.div 
                  variants={fadeIn}
                  className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex justify-center mb-3"
                  >
                    <Building2 size={40} className="text-gray-400" strokeWidth={1.5} />
                  </motion.div>
                  <p className="text-gray-500 mb-1">No ongoing projects found</p>
                  <p className="text-gray-400 text-sm mb-4">Create new projects to get started</p>
                  <Button
                    variant="primary"
                    onClick={() => setSelectedProject(emptyProject)}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    <Plus size={16} strokeWidth={2} />
                    Create Project
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {projects.length > 0 && (
            <motion.div variants={fadeIn} className="flex justify-end mt-4">
              <Button
                variant="primary" 
                onClick={() => setSelectedProject(emptyProject)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
              >
                <Plus size={16} strokeWidth={2} />
                Add Project
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
      
      {!selectedProject && projectDetailsId && (
        <ProjectDetails
          id={projectDetailsId}
          onClose={() => setProjectDetailsId(null)}
          onSubmit={handleUpdateProject}
        />
      )}
      
      {!projectDetailsId && selectedProject && (
        <UpdateProjectPage
          initialData={selectedProject}
          onSubmit={handleUpdateProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </AnimatePresence>
  );
}

export default ProjectsList;
