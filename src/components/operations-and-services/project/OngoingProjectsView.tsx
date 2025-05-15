"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import {
  ArrowSquareOut,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import ProjectDetails from "./ProjectDetails";
import { UpdateProjectPage } from "./CreateNewProject";

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
            <PencilSimple
              size={18}
              onClick={() => setSelectedProject(formatProject)}
              className="text-gray-500 hover:text-blue-600 cursor-pointer"
            />
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
      alert("Project updated!");
      setSelectedProject(null);
      fetchProjects();
    } catch {
      alert("Error updating Project.");
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await deleteProject(id);
      alert("Project deleted!");
      fetchProjects();
    } catch {
      alert("Error deleting Project.");
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
            Project List
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
    </div>
  );
}

export default ProjectsList;
