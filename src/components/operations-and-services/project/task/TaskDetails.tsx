"use client";

import { useEmployees } from "@/hooks/useEmployees";
import { Task } from "@/hooks/useTasks";
import { getCompanyId } from "@/lib/api/company-info/employees"
import { createClient } from "@/lib/supabase/client";
import { CalendarBlank } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface TaskDetailsProps {
  id: number;
  onClose: () => void;
}
function formatDate(dateStr: string): string {
  const [year, month, dayStr] = dateStr.split("-");
  const day = parseInt(dayStr, 10);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = months[parseInt(month, 10) - 1];

  return `${day} ${monthName}, ${year}`;
}

export default function TaskDetails({ id, onClose }: TaskDetailsProps) {
  const [taskDetails, setTaskDetails] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { employees, fetchEmployees } = useEmployees();
  const [projectName, setProjectName] = useState<string | null>(null);

  async function fetchTaskDetails(id: number) {
    setLoading(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("task_records")
        .select("*")
        .eq("id", id)
        .eq("company_id", company_id);

      if (error) {
        setError("Error fetching Task details");
        console.error(error);
        return;
      }

      setTaskDetails(data[0]);

      const projectId = data[0]?.project_id;
      if (projectId) {
        const { data: projectData, error: projectError } = await client
          .from("project_records")
          .select("project_title")
          .eq("id", projectId)
          .eq("company_id", company_id);

        if (projectError) {
          setError("Error fetching Project details");
          console.error(projectError);
          return;
        }

        setProjectName(projectData[0]?.project_title || "N/A");
      }
    } catch (error) {
      setError("Error fetching Task details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      fetchTaskDetails(id);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="md:max-w-6xl mx-auto p-6 md:p-10 text-[#2F2F2F] font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-[#0074FF] mb-4">
          Task Details
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="bg-blue-900 text-white px-4 py-2 rounded-md"
        >
          Back
        </button>
      </div>

      <div className="grid gap-2">
        <div className="flex gap-2">
          <span className="font-bold">Task Name</span>:
          <span className="text-[#555]">
            {taskDetails?.task_title || "N/A"}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Project</span>:
          <span className="text-[#555]">{projectName}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Priority</span>:
          <span>{taskDetails?.priority || "N/A"}</span>
        </div>
        <div className="flex gap-2 items-start">
          <span className="font-bold">Assignee</span>:
          <div className="flex flex-wrap gap-2">
            {taskDetails?.assignees?.length > 0 &&
              taskDetails?.assignees.map((assignee, i) => (
                <span
                  key={i}
                  className="bg-[#E6F0FF] text-[#0074FF] text-xs px-2 py-1 rounded"
                >
                  {employees.filter((employee) => employee.id === assignee)[0]
                    ?.name || "N/A"}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} className="text-gray-500" />
          <span>
            <span className="font-semibold">Start:</span>{" "}
            {formatDate(taskDetails?.start_date || "")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} className="text-gray-500" />
          <span>
            <span className="font-semibold">End:</span>{" "}
            {formatDate(taskDetails?.end_date || "")}
          </span>
        </div>
      </div>
      <div className="mt-6">
        <p>{taskDetails?.task_description}</p>
      </div>
    </div>
  );
}
