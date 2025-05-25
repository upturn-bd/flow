"use client";
import TaskCreateModal, {
  TaskUpdateModal,
} from "./shared/TaskModal";
import { useTasks } from "@/hooks/useTasks";
import { taskSchema } from "@/lib/types";
import { useEffect, useState } from "react";
import { z } from "zod";
import TaskDetails from "./shared/TaskDetails";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Task = z.infer<typeof taskSchema>;

export default function TaskPage() {
  const { tasks, loading, fetchTasks, updateTask, deleteTask } = useTasks();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const handleUpdateTask = async (values: any) => {
    try {
      await updateTask(values);
      toast.success("Task updated successfully");
      setEditTask(null);
      fetchTasks();
    } catch (error) {
      toast.error("Error updating task");
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      setDeletingTaskId(id);
      await deleteTask(id);
      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (error) {
      toast.error("Error deleting task");
      console.error(error);
    } finally {
      setDeletingTaskId(null);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div>
      {!editTask && taskDetailsId === null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 py-12 max-w-6xl mx-auto p-6"
        >
          <h1 className="text-2xl font-bold text-blue-700">Task List</h1>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-lg p-5 flex flex-col gap-3"
                    >
                      <h2 className="text-lg font-bold text-gray-800">{task.task_title}</h2>
                      <p className="text-gray-600 text-sm">{task.task_description}</p>
                      <div className="mt-2 flex items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'High' 
                            ? 'bg-red-100 text-red-800' 
                            : task.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditTask(task)}
                          className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        >
                          <Edit size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => task.id !== undefined && handleDeleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                          className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
                        >
                          {deletingTaskId === task.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => task.id !== undefined && setTaskDetailsId(task.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        >
                          <ExternalLink size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="bg-gray-100 rounded-full p-4 mb-4">
                      <svg
                        className="h-12 w-12 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No tasks available</h3>
                    <p className="mt-1 text-gray-500">Create a new task to get started</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
      
      <AnimatePresence>
        {editTask && (
          <TaskUpdateModal
            onSubmit={handleUpdateTask}
            onClose={() => setEditTask(null)}
            initialData={editTask}
          />
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
