"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import { useEffect, useState } from "react";
import ProjectDetails from "./ProjectDetails";
import { UpdateProjectPage } from "./CreateNewProject";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Edit, Trash2, Clock, Calendar, Building2, User } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";

function ProjectCard({
  project,
  setProjectDetailsId,
  setSelectedProject,
  deleteProject,
}: {
  project: Project;
  setProjectDetailsId: (id: number) => void;
  setSelectedProject: (project: Project) => void;
  deleteProject: (id: number) => void;
}) {
  const {
    employees,
    loading: employeeLoading,
    fetchEmployees,
  } = useEmployees();
  const {
    departments,
    loading: departmentsLoading,
    fetchDepartments,
  } = useDepartments();
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [fetchEmployees, fetchDepartments]);
  
  const {
    id,
    project_title,
    project_lead_id,
    department_id,
    end_date,
    progress,
    description,
    start_date,
    assignees,
    goal,
    status,
    company_id,
  } = project;

  const formatProject = {
    id,
    project_title,
    project_lead_id,
    department_id,
    end_date,
    description,
    start_date,
    assignees,
    goal,
    status,
    company_id,
    progress,
  };
  
  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteProject(id);
      toast.success("Project deleted successfully");
    } catch (error) {
      toast.error("Error deleting project");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (employeeLoading || departmentsLoading) {
    return (
      <LoadingSpinner 
        color="blue" 
        text="Loading project info..." 
        height="h-32" 
        icon={Clock}
      />
    );
  }
  
  if (!employeeLoading && !departmentsLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 mb-6 w-full border border-gray-200"
      >
        <div className="flex justify-between">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
            {project_title}
          </h2>
          <div className="flex gap-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedProject(formatProject)}
              className="rounded-full p-2"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="rounded-full p-2"
            >
              <Trash2 size={16} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => id !== undefined && setProjectDetailsId(id)}
              className="rounded-full p-2"
            >
              <ExternalLink size={16} />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Building2 size={14} className="flex-shrink-0" />
            <span className="font-medium">Department:</span>
            <span>
              {departments.filter(
                (department) => department.id === department_id
              )[0]?.name || "N/A"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User size={14} className="flex-shrink-0" />
            <span className="font-medium">Lead:</span>
            <span>
              {employees.filter((employee) => employee.id === project_lead_id)[0]
                ?.name || "N/A"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock size={14} className="flex-shrink-0" />
            <span className="font-medium">Progress:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              {progress || "N/A"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar size={14} className="flex-shrink-0" />
            <span className="font-medium">Deadline:</span>
            <span>{end_date}</span>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p>{description}</p>
        </div>
      </motion.div>
    );
  }
  return null;
}

function ProjectsList() {
  const { projects, loading, fetchProjects, updateProject, deleteProject } =
    useProjects();
  const [projectDetailsId, setProjectDetailsId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleUpdateProject = async (values: any) => {
    try {
      await updateProject(values);
      toast.success("Project updated successfully");
      setSelectedProject(null);
      fetchProjects();
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
        <LoadingSpinner color="blue" text="Loading projects..." height="h-screen" />
      )}
      
      {!selectedProject && !projectDetailsId && !loading && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="px-2 py-4 md:p-6"
        >
          <h1 className="text-xl font-bold text-blue-700 mb-6">
            Ongoing Projects
          </h1>

          <div className="space-y-4">
            <AnimatePresence>
              {projects.length > 0 &&
                projects.map((project, idx) => (
                  <ProjectCard
                    deleteProject={handleDeleteProject}
                    setSelectedProject={setSelectedProject}
                    key={project.id || idx}
                    project={project}
                    setProjectDetailsId={setProjectDetailsId}
                  />
                ))}
            </AnimatePresence>
          </div>
          
          {projects.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No ongoing projects</h3>
              <p className="mt-1 text-gray-500">Create new projects to get started</p>
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
