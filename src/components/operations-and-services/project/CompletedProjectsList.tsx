"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import { ArrowSquareOut, TrashSimple } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import ProjectDetails from "./ProjectDetails";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";

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

  if (employeeLoading || departmentsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }
  if (!employeeLoading && !departmentsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 w-full max-w-4xl">
        <div className="flex justify-between">
          <h2 className="text-lg md:text-xl font-bold text-[#0052CC] mb-4">
            Project: {project_title}
          </h2>
          <div className="flex gap-x-2">
            <TrashSimple
              onClick={() => deleteProject(id)}
              size={18}
              className="text-red-600 hover:text-red-800 cursor-pointer"
            />
            <ArrowSquareOut
              onClick={() => setProjectDetailsId(id)}
              size={18}
              className="text-slate-800 hover:text-blue-800 cursor-pointer ml-4 md:ml-8"
            />
          </div>
        </div>
        <div className="space-y-1 text-sm text-gray-800">
          <p>
            <span className="font-semibold">Department</span>:
            {departments.filter(
              (department) => department.id === department_id
            )[0]?.name || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Lead</span>:
            {employees.filter((employee) => employee.id === project_lead_id)[0]
              ?.name || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Progress</span>: {progress || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Deadline</span>: {end_date}
          </p>
        </div>
        <div className="mt-4 text-sm text-gray-700">
          <p>{description}</p>
        </div>
      </div>
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

  async function fetchProjects() {
    setLoading(true);
    const client = createClient();
    const company_id = await getCompanyId();
    const user = await getUserInfo();

    try {
      if (user.role === "Admin") {
        const { data, error } = await client
          .from("project_records")
          .select("*")
          .eq("status", "Completed")
          .eq("company_id", company_id);

        if (error) throw error;
        const formatData = data?.map((item) => {
          const { created_at, updated_at, ...rest } = item;
          return {
            ...rest,
          };
        });
        console.log(formatData);
        setProjects(formatData);
        return;
      }
      const { data, error } = await client
        .from("project_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("status", "Completed")
        .or(
          `assignees.cs.{${user.id}}, department_id.eq.${user.department_id}, project_lead_id.eq.${user.id}`
        );

      if (error) throw error;
      const formatData = data?.map((item) => {
        const { created_at, updated_at, ...rest } = item;
        return {
          ...rest,
        };
      });
      console.log(formatData);
      setProjects(formatData);
      return;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: number) => {
    try {
      await deleteProject(id);
      alert("Project deleted!");
      fetchProjects();
    } catch {
      alert("Error deleting Project.");
    }
  };

  const handleUpdateProject = async (values: any) => {
    try {
      await updateProject(values);
      alert("Project updated!");
      setSelectedProject(null);
      fetchProjects();
    } catch {
      alert("Error updating Project.");
    }
  };

  return (
    <div>
      {loading && (
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      )}
      {!selectedProject && !projectDetailsId && !loading && (
        <div className="px-2 py-4 md:p-6">
          <h1 className="text-xl font-bold text-[#003366] mb-6">
            Completed Project List
          </h1>

          {projects.length > 0 &&
            projects.map((project, idx) => (
              <ProjectCard
                deleteProject={handleDeleteProject}
                setSelectedProject={setSelectedProject}
                key={idx}
                project={project}
                setProjectDetailsId={setProjectDetailsId}
              />
            ))}
          {projects.length === 0 && (
            <div className="flex items-center justify-center h-screen">
              <h2 className="text-lg text-gray-600 mb-6">No Projects Found</h2>
            </div>
          )}
        </div>
      )}
      {projectDetailsId && (
        <ProjectDetails
          id={projectDetailsId}
          onClose={() => setProjectDetailsId(null)}
          onSubmit={handleUpdateProject}
        />
      )}
    </div>
  );
}

export default CompletedProjectsList;
