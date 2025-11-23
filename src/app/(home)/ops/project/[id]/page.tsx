"use client";

import { use } from "react"; // ✅ Import React.use() to unwrap params
import ProjectLayout from "../ProjectLayout";
import ProjectDetails from "@/components/ops/project/ProjectDetails";
import { useEmployeesContext, useDepartmentsContext } from "@/contexts";
import { useProjects } from "@/hooks/useProjects";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // ✅ unwrap params safely
  const projectDetailsId = String(id);

  const { employees } = useEmployeesContext();
  const { departments } = useDepartmentsContext();

  return (
    <ProjectLayout
      overrideContent={
        <ProjectDetails
          id={projectDetailsId}
          employees={employees}
          departments={departments}
          onClose={() => history.back()}
          setActiveTab={() => { }}
        />
      }
    />
  );
}
