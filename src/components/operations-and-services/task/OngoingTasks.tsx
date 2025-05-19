"use client";
import TaskCreateModal, {
  TaskUpdateModal,
} from "@/components/operations-and-services/task/TaskModal";
import { useTasks } from "@/hooks/useTasks";
import { taskSchema } from "@/lib/types";
import {
  ArrowSquareOut,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import TaskDetails from "../project/task/TaskDetails";

type Task = z.infer<typeof taskSchema>;

export default function TaskPage() {
  const { tasks, loading, fetchTasks, updateTask, deleteTask } = useTasks();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);

  const handleUpdateTask = async (values: any) => {
    try {
      await updateTask(values);
      alert("Task updated!");
      setEditTask(null);
      setEditTask(null);
      fetchTasks();
    } catch {
      alert("Error updating Task.");
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      alert("Task deleted!");
      fetchTasks();
    } catch {
      alert("Error deleting Task.");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading) {
    return (
      <div className="mt-20 flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div>
      {!loading && !editTask && !taskDetailsId && (
        <div className="space-y-6 py-12 max-w-6xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-blue-700">Task List</h1>
          <div className="grid grid-cols-1 gap-4">
            {tasks.length > 0 &&
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-200 shadow-md rounded-lg p-4 flex flex-col gap-2"
                >
                  <h2 className="text-lg font-bold">{task.task_title}</h2>
                  <p>{task.task_description}</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditTask(task);
                      }}
                      className="px-3 py-2 text-white hover:text-gray-300"
                    >
                      <PencilSimple
                        size={16}
                        className="text-gray-600 cursor-pointer"
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-2 text-white hover:text-gray-300"
                    >
                      <TrashSimple
                        size={16}
                        className="text-red-600 cursor-pointer"
                      />
                    </button>
                    <button
                      onClick={() => setTaskDetailsId(task.id)}
                      className="px-3 py-2 text-white hover:text-gray-300"
                    >
                      <ArrowSquareOut
                        size={18}
                        className="text-slate-800 hover:text-blue-800 cursor-pointer ml-4 md:ml-8"
                      />
                    </button>
                  </div>
                </div>
              ))}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center">
                Sorry, no items available.
              </div>
            )}
          </div>
        </div>
      )}
      {editTask && (
        <TaskUpdateModal
          onSubmit={handleUpdateTask}
          onClose={() => setEditTask(null)}
          initialData={editTask}
        />
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
