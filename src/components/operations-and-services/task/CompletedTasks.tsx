"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import { ArrowSquareOut, TrashSimple } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/api/company-info/employees"
import { z } from "zod";
import { taskSchema } from "@/lib/types";
import TaskDetails from "../project/task/TaskDetails";

type Task = z.infer<typeof taskSchema>;

function TaskCard({
  task,
  setTaskDetailsId,
  deleteTask,
}: {
  task: Task;
  setTaskDetailsId: (id: number) => void;
  setSelectedTask: (Task: Task) => void;
  deleteTask: (id: number) => void;
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
  const { id, task_title, department_id, task_description } = task;

  if (employeeLoading || departmentsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }
  if (!employeeLoading && !departmentsLoading) {
    return (
      <div className="bg-gray-200 rounded-xl shadow-md p-6 mb-6 w-full max-w-4xl">
        <div className="flex justify-between">
          <h2 className="text-md md:text-lg font-semibold mb-4">
            {task_title}
          </h2>
          <div className="flex gap-x-2">
            <TrashSimple
              onClick={() => deleteTask(id)}
              size={18}
              className="text-red-600 hover:text-red-800 cursor-pointer"
            />
            <ArrowSquareOut
              onClick={() => setTaskDetailsId(task.id)}
              size={18}
              className="text-slate-800 hover:text-blue-800 cursor-pointer ml-4 md:ml-8"
            />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-700">
          <p>{task_description}</p>
        </div>
      </div>
    );
  }
  return null;
}

function CompletedTasksList() {
  const { deleteTask } = useTasks();
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchTasks() {
    setLoading(true);
    const client = createClient();
    const company_id = await getCompanyId();
    const user = await getUserInfo();

    try {
      const { data, error } = await client
        .from("task_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("status", true)
        .or(
          `assignees.cs.{${user.id}}, department_id.eq.${user.department_id}, created_by.eq.${user.id}`
        );

      if (error) throw error;
      const formatData = data?.map((item) => {
        const { created_at, updated_at, ...rest } = item;
        return {
          ...rest,
        };
      });
      setTasks(formatData);
      return;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      alert("Task deleted!");
      fetchTasks();
    } catch {
      alert("Error deleting Task.");
    }
  };

  return (
    <div>
      {loading && (
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      )}
      {!selectedTask && !taskDetailsId && !loading && (
        <div className="px-2 py-4 md:p-6">
          <h1 className="text-xl font-bold text-[#003366] mb-6">
            Completed Task List
          </h1>

          {tasks.length > 0 &&
            tasks.map((task, idx) => (
              <TaskCard
                deleteTask={handleDeleteTask}
                setSelectedTask={setSelectedTask}
                key={idx}
                task={task}
                setTaskDetailsId={setTaskDetailsId}
              />
            ))}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-screen">
              <h2 className="text-lg text-gray-600 mb-6">No tasks Found</h2>
            </div>
          )}
        </div>
      )}
      {taskDetailsId && (
        <TaskDetails
          onClose={() => setTaskDetailsId(null)}
          id={taskDetailsId}
        />
      )}
    </div>
  );
}

export default CompletedTasksList;
