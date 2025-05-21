"use client";

import { useEmployees } from "@/hooks/useEmployees";
import { Task } from "@/hooks/useTasks";
import { getCompanyId } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, Loader2, User, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';

interface TaskDetailsProps {
  id: number;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  
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
        toast.error("Error fetching task details");
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
          toast.error("Error fetching project details");
          console.error(projectError);
          return;
        }

        setProjectName(projectData[0]?.project_title || "N/A");
      }
    } catch (error) {
      setError("Error fetching Task details");
      toast.error("Error fetching task details");
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
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-500">Loading task details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <XCircle className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={onClose}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft size={16} />
          <span>Go back</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="md:max-w-4xl mx-auto p-6 md:p-10 bg-white rounded-lg shadow-sm border border-gray-200"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-blue-700">
          Task Details
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </motion.button>
      </div>

      <div className="bg-blue-50 rounded-lg p-5 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{taskDetails?.task_title || "N/A"}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              taskDetails?.priority === 'High' 
                ? 'bg-red-100 text-red-800' 
                : taskDetails?.priority === 'Medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {taskDetails?.priority || "N/A"}
            </span>
          </div>
          
          {projectName && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium">Project:</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs">
                {projectName}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Status:</span>
            <div className="flex items-center gap-2">
              {taskDetails?.status ? (
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle size={14} className="text-green-500" />
                  <span>Completed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-blue-700">
                  <Clock size={14} className="text-blue-500" />
                  <span>Ongoing</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
          <Calendar size={18} className="text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Start Date</p>
            <p className="font-medium">{formatDate(taskDetails?.start_date || "")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
          <Calendar size={18} className="text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">End Date</p>
            <p className="font-medium">{formatDate(taskDetails?.end_date || "")}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-2">Description</h3>
        <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
          {taskDetails?.task_description || "No description provided."}
        </div>
      </div>

      <div>
        <h3 className="text-md font-medium text-gray-700 mb-2">Assignees</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {taskDetails?.assignees?.length ? (
            <div className="flex flex-wrap gap-2">
              {taskDetails.assignees.map((assignee, i) => {
                const employee = employees.find(emp => emp.id === assignee);
                return (
                  <div 
                    key={i}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <User size={14} />
                    <span>{employee?.name || "Unknown"}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No assignees</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
