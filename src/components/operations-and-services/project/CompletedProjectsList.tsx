"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { useEffect, useState } from "react";
import ProjectDetails from "./ProjectDetails";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Trash2, Clock, Calendar, Building2, User, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';

function ProjectCard({
  project,
  setProjectDetailsId,
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
  } = project;

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
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
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
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              {project_title}
            </h2>
          </div>
          <div className="flex gap-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => id !== undefined && setProjectDetailsId(id)}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
            >
              <ExternalLink size={16} />
            </motion.button>
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
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
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

function CompletedProjectsList() {
  const { deleteProject, updateProject } = useProjects();
  const [projectDetailsId, setProjectDetailsId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCompletedProjects() {
    setLoading(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("project_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("status", "Completed");

      if (error) {
        setError("Error fetching Projects");
        console.error(error);
        return;
      }

      // Format project data
      const formatData = data?.map((item: any) => {
        const { created_at, updated_at, ...rest } = item;
        return {
          ...rest,
        };
      });

      setProjects(formatData || []);
    } catch (error) {
      setError("Error fetching Projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCompletedProjects();
  }, []);

  const handleDeleteProject = async (id: number) => {
    try {
      await deleteProject(id);
      toast.success("Project deleted successfully");
      fetchCompletedProjects();
    } catch (error) {
      toast.error("Error deleting project");
      console.error(error);
    }
  };

  const handleUpdateProject = async (values: any) => {
    try {
      await updateProject(values);
      toast.success("Project updated successfully");
      setSelectedProject(null);
      fetchCompletedProjects();
    } catch (error) {
      toast.error("Error updating project");
      console.error(error);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center h-screen"
        >
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500">Loading projects...</p>
          </div>
        </motion.div>
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
            Completed Projects
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
                <CheckCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No completed projects</h3>
              <p className="mt-1 text-gray-500">Projects will appear here once they're marked as complete</p>
            </motion.div>
          )}
        </motion.div>
      )}
      
      {projectDetailsId && (
        <ProjectDetails
          id={projectDetailsId}
          onClose={() => setProjectDetailsId(null)}
          onSubmit={handleUpdateProject}
        />
      )}
    </AnimatePresence>
  );
}

export default CompletedProjectsList;
