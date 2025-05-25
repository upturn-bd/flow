"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { z } from "zod";
import { taskSchema } from "@/lib/types";
import TaskDetails from "../project/task/TaskDetails";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [fetchEmployees, fetchDepartments]);

  const { id, task_title, department_id, task_description } = task;

  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await deleteTask(id);
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (employeeLoading || departmentsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">Loading task information...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-lg p-5 flex flex-col gap-3"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          <CheckCircle
            size={18}
            className="text-green-500 mt-1 flex-shrink-0"
          />
          <h2 className="text-md md:text-lg font-semibold text-gray-800">
            {task_title}
          </h2>
        </div>
        <div className="flex gap-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => id !== undefined && setTaskDetailsId(id)}
            className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
          >
            <ExternalLink size={16} />
          </motion.button>
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-600">
        <p>{task_description}</p>
      </div>

      {department_id &&
        departments.find((dept) => dept.id === department_id) && (
          <div className="mt-1">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {departments.find((dept) => dept.id === department_id)?.name ||
                "Unknown department"}
            </span>
          </div>
        )}
    </motion.div>
  );
}

function CompletedTasksList() {
  const { deleteTask } = useTasks();
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchTasks() {
    setLoading(true);

    const company_id = await getCompanyId();
    const user = await getEmployeeInfo();

    try {
      const { data, error } = await supabase
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
    } catch (error) {
      toast.error("Failed to fetch tasks");
      console.error(error);
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
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500">Loading completed tasks...</p>
          </motion.div>
        )}

        {!selectedTask && taskDetailsId === null && !loading && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-2 py-4 md:p-6 max-w-5xl mx-auto"
          >
            <h1 className="text-xl font-bold text-blue-700 mb-6">
              Completed Tasks
            </h1>

            <div className="space-y-4">
              <AnimatePresence>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      deleteTask={handleDeleteTask}
                      setSelectedTask={setSelectedTask}
                      task={task}
                      setTaskDetailsId={setTaskDetailsId}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="bg-gray-100 rounded-full p-4 mb-4">
                      <CheckCircle className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      No completed tasks
                    </h3>
                    <p className="mt-1 text-gray-500">
                      Tasks will appear here once they're marked as complete
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {taskDetailsId !== null && (
          <TaskDetails
            onClose={() => setTaskDetailsId(null)}
            id={taskDetailsId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompletedTasksList;
