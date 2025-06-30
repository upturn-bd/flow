"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api";
import { getCompanyId } from "@/lib/api";
import { useEffect, useState } from "react";
import ProjectDetails from "./ProjectDetails";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Trash2, Clock, Calendar, Building2, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import ProjectCard from "./ProjectCard";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";

function CompletedProjectsList() {
  const { deleteProject, updateProject } = useProjects();
  const [projectDetailsId, setProjectDetailsId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployees();
  const { departments, fetchDepartments, loading: departmentsLoading } = useDepartments();

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
    fetchEmployees();
    fetchDepartments();
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
      if (selectedProject?.id) {
        await updateProject(selectedProject.id, values);
        toast.success("Project updated successfully");
        setSelectedProject(null);
        fetchCompletedProjects();
      }
    } catch (error) {
      toast.error("Error updating project");
      console.error(error);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingSection 
          text="Loading completed projects..."
          icon={CheckCircle}
          color="blue"
        />
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
              {projects.length > 0 ? (
                projects.map((project, idx) => (
                  typeof project.id !== "undefined" ? (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={undefined}
                      onDelete={() => handleDeleteProject(project.id as number)}
                      onDetails={() => setProjectDetailsId(project.id as number)}
                      employees={employees}
                      departments={departments.filter(d => d.id != null) as any}
                      showEdit={false}
                      showDelete={true}
                      showDetails={true}
                      statusIcon={<CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" />}
                      progressColor="bg-green-100 text-green-800"
                    />
                  ) : null
                ))
              ) : (
                <EmptyState 
                  icon={<CheckCircle className="h-12 w-12" />}
                  title="No completed projects"
                  description="Projects will appear here once they're marked as complete"
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
      {projectDetailsId && (
        <ProjectDetails
          id={projectDetailsId}
          employees={employees}
          departments={departments}
          onClose={() => setProjectDetailsId(null)}
          onSubmit={handleUpdateProject}
        />
      )}
    </AnimatePresence>
  );
}

export default CompletedProjectsList;
