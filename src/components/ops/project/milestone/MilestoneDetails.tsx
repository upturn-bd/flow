"use client";

import React, { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Pencil,
  Trash2,
  Plus,
  Target,
  Users,
  ArrowUpRight,
  ChevronLeft,
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { Milestone } from "@/hooks/useMilestones";
import { Task, useTasks } from "@/hooks/useTasks";
import { createClient } from '@/lib/supabase/client';
import TaskCreateModal from "../../task/shared/TaskCreateModal";
import TaskUpdateModal from "../../task/shared/TaskUpdateModal";
import TaskDetails from "../../task/shared/TaskDetails";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getCompanyId, getEmployeeId } from "@/lib/utils/auth";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/Card";

interface MilestoneDetailsProps {
  id: number;
  onClose: () => void;
  project_created_by: string;
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

export default function MilestoneDetails({
  id,
  onClose,
  project_created_by
}: MilestoneDetailsProps) {
  const [milestoneId, setMilestoneId] = useState<number>(id);
  const [milestoneDetails, setMilestoneDetails] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { employees, fetchEmployees } = useEmployees();

  // Tasks states and functions
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { createTask, updateTask, deleteTask } = useTasks();
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);

  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    const initUserId = async () => {
      const userId = await getEmployeeId();

      setUserId(userId)
    }

    initUserId()
  }, [])

  const handleCreateTask = async (values: any) => {
    try {
      await createTask(values);
      setIsCreatingTask(false);
      fetchTasksByMilestoneId(milestoneId);
    } catch {
      alert("Error creating Task.");
    }
  };

  const handleUpdateTask = async (values: any) => {
    try {
      await updateTask(values);
      setSelectedTask(null);
      fetchTasksByMilestoneId(milestoneId);
      toast.success("Task updated successfully")
    } catch {
      alert("Error updating Task.");
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      fetchTasksByMilestoneId(milestoneId);
      toast.success("Task deleted successfully")
    } catch {
      alert("Error deleting Task.");
    }
  };

  const handleDisplayUpdateTaskModal = (id: number) => {
    const selectedTask = tasks.find((task: Task) => task.id === id);
    if (selectedTask) setSelectedTask(selectedTask);
  };

  async function fetchMilestoneDetails(id: number) {
    setLoading(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("milestone_records")
        .select("*")
        .eq("id", id)
        .eq("company_id", company_id);

      if (error) {
        setError("Error fetching Milestone details");
        console.error(error);
        return;
      }

      setMilestoneDetails(data[0]);
    } catch (error) {
      setError("Error fetching Milestone details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTasksByMilestoneId(id: number) {
    setLoadingTasks(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("task_records")
        .select("*")
        .eq("milestone_id", id)
        .eq("company_id", company_id);

      if (error) {
        setError("Error fetching tasks");
        console.error(error);
        return;
      }

      const formatData = data?.map((item) => {
        const { created_at, updated_at, department_id, ...rest } = item;
        return rest;
      });

      setTasks(formatData);
    } catch (error) {
      setError("Error fetching tasks");
      console.error(error);
    } finally {
      setLoadingTasks(false);
    }
  }

  useEffect(() => {
    if (id) {
      fetchMilestoneDetails(id);
      fetchTasksByMilestoneId(id);
      setMilestoneId(id);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {!taskDetailsId && (
        <div className="md:max-w-6xl mx-auto p-6 md:p-10 text-gray-900">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Target size={24} className="text-gray-600" strokeWidth={2} />
              <h2 className="text-xl md:text-2xl font-semibold">
                Milestone Details
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-150"
            >
              <ChevronLeft size={16} strokeWidth={2} />
              Back
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4"
          >
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Milestone Name:</span>
                <span className="text-gray-900">
                  {milestoneDetails?.milestone_title || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Status:</span>
                {/* <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                  {milestoneDetails?.status || "N/A"}
                </span> */}

                <StatusBadge
                  status={milestoneDetails?.status || "N/A"}
                />
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-700">Assignees:</span>
                <div className="flex flex-wrap gap-2">
                  {(milestoneDetails?.assignees && milestoneDetails.assignees.length > 0) ? (
                    milestoneDetails.assignees.map((assignee: string, i: number) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                      >
                        {employees.find((employee) => employee.id === assignee)?.name || "N/A"}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No assignees</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-4 text-sm border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} strokeWidth={2} />
                <span>
                  <span className="font-medium">Start:</span>{" "}
                  {formatDate(milestoneDetails?.start_date || "")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} strokeWidth={2} />
                <span>
                  <span className="font-medium">End:</span>{" "}
                  {formatDate(milestoneDetails?.end_date || "")}
                </span>
              </div>
            </div>

            {milestoneDetails?.description && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-gray-600">{milestoneDetails.description}</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Target size={20} className="text-gray-600" strokeWidth={2} />
                <h3 className="text-lg font-semibold">Task List</h3>
              </div>

              {project_created_by === userId && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsCreatingTask(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors duration-150 shadow-sm"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Add Task
                </motion.button>

              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {!loadingTasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3"
                  >
                    <div className="font-medium text-gray-900">
                      {task.task_title}
                    </div>
                    <div className="flex justify-end items-center gap-2">
                      {project_created_by === userId && (
                        <>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => task.id !== null && handleDisplayUpdateTaskModal(task.id!)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-150"
                          >
                            <Pencil size={15} strokeWidth={2} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => task.id !== null && handleDeleteTask(task.id!)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-150"
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </motion.button>
                        </>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => task.id !== null && setTaskDetailsId(task.id!)}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-150 ml-2"
                      >
                        <ArrowUpRight size={15} strokeWidth={2} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : loadingTasks ? (
                <div className="col-span-3 flex items-center justify-center h-32">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="col-span-3 flex flex-col items-center justify-center h-32 text-gray-500">
                  <Target size={32} strokeWidth={1.5} className="mb-3 text-gray-400" />
                  <p>No tasks found</p>
                </div>
              )}
            </div>
          </motion.div>

          {isCreatingTask && (
            <TaskCreateModal
              projectId={milestoneDetails?.project_id ?? 0}
              milestoneId={milestoneId}
              onClose={() => setIsCreatingTask(false)}
              onSubmit={handleCreateTask}
            />
          )}

          {selectedTask && (
            <TaskUpdateModal
              initialData={{
                id: selectedTask.id,
                task_title: selectedTask.task_title,
                task_description: selectedTask.task_description,
                start_date: selectedTask.start_date,
                end_date: selectedTask.end_date,
                priority: selectedTask.priority,
                status: selectedTask.status || false,
                project_id: selectedTask.project_id,
                milestone_id: selectedTask.milestone_id,
                assignees: selectedTask.assignees,
              }}
              onClose={() => setSelectedTask(null)}
              onSubmit={handleUpdateTask}
            />
          )}
        </div>
      )}

      {taskDetailsId && (
        <TaskDetails
          id={taskDetailsId}
          onTaskStatusUpdate={() => fetchTasksByMilestoneId(milestoneId)}
          onClose={() => setTaskDetailsId(null)}
        />
      )}
    </div>
  );
}
