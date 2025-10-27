"use client";

import { useEmployees } from "@/hooks/useEmployees";
import { Task, useTasks} from "@/hooks/useTasks";
import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, User, XCircle, Clock, Target } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { getCompanyId } from "@/lib/utils/auth";

interface TaskDetailsProps {
  id: number;
  onTaskStatusUpdate: () => void;
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
  const { completeTask, reopenTask } = useTasks();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  async function fetchTaskDetails(id: number) {
    setLoading(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("task_records")
        .select("*")
        .eq("id", id)
        .eq("company_id", company_id)
        .single();

      if (error) {
        setError("Error fetching Task details");
        toast.error("Error fetching task details");
        console.error(error);
        return;
      }

      setTaskDetails(data);

      const projectId = data?.project_id;
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

        setProjectName(projectData?.[0]?.project_title || "N/A");
      }
    } catch (error) {
      setError("Error fetching Task details");
      toast.error("Error fetching task details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleTaskStatusUpdate = async () => {
    if (!taskDetails?.id) return;

    setIsUpdatingStatus(true);
    try {
      if (taskDetails.status) {
        // Task is completed, reopen it
        const result = await reopenTask(
          taskDetails.id,
          taskDetails.project_id,
          taskDetails.milestone_id
        );
        if (result.success) {
          toast.success("Task reopened successfully!");
          // Refresh task details
          fetchTaskDetails(id);
        } else {
          throw new Error("Failed to reopen task");
        }
      } else {
        // Task is ongoing, complete it
        const result = await completeTask(
          taskDetails.id,
          taskDetails.project_id,
          taskDetails.milestone_id
        );
        if (result.success) {
          toast.success("Task marked as completed!");
          // Refresh task details
          fetchTaskDetails(id);
        } else {
          throw new Error("Failed to complete task");
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (id !== null) {
      fetchTaskDetails(id);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  if (loading) {
    return (
      <LoadingSection 
        text="Loading task details..."
        icon={Target}
        color="blue"
      />
    );
  }

  if (error) {
    return (
      <EmptyState 
        icon={<XCircle className="h-12 w-12" />}
        title="Error loading task"
        description={error}
        action={{
          label: "Go back",
          onClick: onClose,
          icon: <ChevronLeft size={16} />
        }}
      />
    );
  }

  if (!taskDetails) {
    return (
      <EmptyState 
        icon={<Target className="h-12 w-12" />}
        title="Task not found"
        description="The requested task could not be found"
        action={{
          label: "Go back",
          onClick: onClose,
          icon: <ChevronLeft size={16} />
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Target size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTaskStatusUpdate}
            disabled={isUpdatingStatus}
            variant={taskDetails?.status ? "outline" : "primary"}
            size="sm"
          >
            {isUpdatingStatus ? "Updating..." : (taskDetails?.status ? "Reopen Task" : "Mark as Complete")}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
          >
            <ChevronLeft size={16} className="mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Task Overview */}
      <Card>
        <CardHeader 
          title={taskDetails?.task_title || "Untitled Task"}
          subtitle={taskDetails?.task_description || "No description available"}
          icon={<Target size={20} />}
          action={
            <StatusBadge 
              status={taskDetails?.status ? "completed" : "ongoing"} 
              variant={taskDetails?.status ? "success" : "info"}
            />
          }
        />
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow 
              icon={<User size={16} />}
              label="Assigned to"
              value={
                taskDetails?.assignees && taskDetails.assignees.length > 0 
                  ? `${taskDetails.assignees.length} assignee${taskDetails.assignees.length > 1 ? 's' : ''}`
                  : "Not assigned"
              }
            />
            
            <InfoRow 
              icon={<Calendar size={16} />}
              label="Start Date"
              value={formatDate(taskDetails?.start_date || "")}
            />
            
            <InfoRow 
              icon={<Calendar size={16} />}
              label="End Date"
              value={formatDate(taskDetails?.end_date || "")}
            />
            
            {taskDetails?.priority && (
              <InfoRow 
                icon={<Clock size={16} />}
                label="Priority"
                value={
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    taskDetails.priority === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : taskDetails.priority === 'normal' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {taskDetails.priority}
                  </span>
                }
              />
            )}
            
            {projectName && (
              <InfoRow 
                icon={<Target size={16} />}
                label="Project"
                value={projectName}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Description */}
      {taskDetails?.task_description && (
        <Card>
          <CardHeader 
            title="Description"
            icon={<Target size={20} />}
          />
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {taskDetails.task_description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignees */}
      {taskDetails?.assignees && taskDetails.assignees.length > 0 && (
        <Card>
          <CardHeader 
            title="Assignees"
            icon={<User size={20} />}
          />
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {taskDetails.assignees.map((assigneeId: string, index: number) => {
                const employee = employees.find(emp => emp.id === assigneeId);
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    <User size={14} />
                    <span>{employee?.name || "Unknown Employee"}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
