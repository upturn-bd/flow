"use client";

import { useEmployees } from "@/hooks/useEmployees";
import { Milestone } from "@/hooks/useMilestones";
import { Task, useTasks } from "@/hooks/useTasks";
import { getCompanyId } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowSquareOut,
  CalendarBlank,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import TaskCreateModal, { TaskUpdateModal } from "../task/TaskModal";
import TaskDetails from "../task/TaskDetails";
import { createClient } from '@/lib/supabase/client';

interface MilestoneDetailsProps {
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
export default function MilestoneDetails({
  id,
  onClose,
}: MilestoneDetailsProps) {
  const [milestoneId, setMilestoneId] = useState<number>(id);
  const [milestoneDetails, setMilestoneDetails] = useState<Milestone | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { employees, fetchEmployees } = useEmployees();

  // Milestones states and functions
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { createTask, updateTask, deleteTask } = useTasks();
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);

  const handleCreateTask = async (values: any) => {
    try {
      await createTask(values);
      alert("Task created!");
      setIsCreatingTask(false);
      fetchTasksByMilestoneId(milestoneId);
    } catch {
      alert("Error creating Task.");
    }
  };

  const handleUpdateTask = async (values: any) => {
    try {
      await updateTask(values);
      alert("Task updated!");
      setSelectedTask(null);
      fetchTasksByMilestoneId(milestoneId);
    } catch {
      alert("Error updating Task.");
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      alert("Task deleted!");
      fetchTasksByMilestoneId(milestoneId);
    } catch {
      alert("Error deleting Task.");
    }
  };

  const handleDisplayUpdateTaskeModal = (id: number) => {
    const selectedTask = tasks.filter((task: Task) => task.id === id)[0];
    setSelectedTask(selectedTask);
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
        return {
          ...rest,
        };
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
    <div>
      {!taskDetailsId && (
        <div className="md:max-w-6xl mx-auto p-6 md:p-10 text-[#2F2F2F] font-sans">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-[#0074FF] mb-4">
              Milestone Details
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
              <span className="font-bold">Milestone Name</span>:
              <span className="text-[#555]">
                {milestoneDetails?.milestone_title || "N/A"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Status</span>:
              <span>{milestoneDetails?.status || "N/A"}</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="font-bold">Assignee</span>:
              <div className="flex flex-wrap gap-2">
                {(milestoneDetails?.assignees && milestoneDetails.assignees.length > 0) &&
                  milestoneDetails.assignees.map((assignee, i) => (
                    <span
                      key={i}
                      className="bg-[#E6F0FF] text-[#0074FF] text-xs px-2 py-1 rounded"
                    >
                      {employees.filter(
                        (employee) => employee.id === assignee
                      )[0]?.name || "N/A"}
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
                {formatDate(milestoneDetails?.start_date || "")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarBlank size={16} className="text-gray-500" />
              <span>
                <span className="font-semibold">End:</span>{" "}
                {formatDate(milestoneDetails?.end_date || "")}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <p>{milestoneDetails?.description}</p>
          </div>
          {/* Tasks */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#2F2F2F]">
                Task List
              </h3>

              <button
                type="button"
                onClick={() => setIsCreatingTask(true)}
                className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
              >
                +
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {!loadingTasks &&
                tasks.length > 0 &&
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-200 rounded p-4 space-y-1"
                  >
                    <div className="font-semibold text-lg text-black">
                      {task.task_title}
                    </div>
                    <div className="flex justify-end gap-2">
                      <PencilSimple
                        size={16}
                        onClick={() => task.id && handleDisplayUpdateTaskeModal(task.id)}
                        className="text-gray-600 cursor-pointer"
                      />
                      <TrashSimple
                        onClick={() => task.id && handleDeleteTask(task.id)}
                        size={16}
                        className="text-red-600 cursor-pointer"
                      />
                      <ArrowSquareOut
                        onClick={() => task.id && setTaskDetailsId(task.id)}
                        size={18}
                        className="text-slate-800 hover:text-blue-800 cursor-pointer ml-4 md:ml-8"
                      />
                    </div>
                  </div>
                ))}
              {loadingTasks && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">Loading...</p>
                </div>
              )}
              {!loadingTasks && tasks.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">No tasks found.</p>
                </div>
              )}
            </div>
          </div>
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
              initialData={selectedTask}
              onClose={() => setSelectedTask(null)}
              onSubmit={handleUpdateTask}
            />
          )}
        </div>
      )}
      {taskDetailsId && (
        <TaskDetails
          id={taskDetailsId}
          onClose={() => setTaskDetailsId(null)}
        />
      )}
    </div>
  );
}
