"use client";

import {
  createTask as cTask,
  deleteTask as dTask,
  getTasks,
  updateTask as uTask,
} from "@/lib/api/operations-and-services/project/task";
import { taskSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type Task = z.infer<typeof taskSchema>;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (task: Task) => {
    const data = await cTask(task);
    return { success: true, status: 200, data };
  };

  const updateTask = async (task: Task) => {
    const data = await uTask(task);
    return { success: true, status: 200, data };
  };

  const deleteTask = async (id: number) => {
    const data = await dTask(id);
    return { success: true, status: 200, data };
  };

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
