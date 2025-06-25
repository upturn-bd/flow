"use client";

import {
  createTask as cTask,
  deleteTask as dTask,
  updateTask as uTask,
  getUserTasks,
  getProjectTasks,
  getMilestoneTasks,
  completeTask as cmpTask,
  reopenTask as ropTask,
  updateTasksMilestone,
  getProjectTaskStats,
  getTaskById,
  TaskFilters,
} from "@/lib/api/operations-and-services/project/task";
import { Task } from "@/lib/types/schemas";
import { useState, useCallback } from "react";

// Re-export Task type for components
export type { Task };

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    unassigned: number;
    inProgress: number;
  } | null>(null);

  const fetchTasks = useCallback(async (filters?: TaskFilters) => {
    setLoading(true);
    setError(null);
    try {
      let data: Task[];
      
      if (filters?.projectId && typeof filters.milestoneId === 'number') {
        // Fetch tasks for specific milestone
        data = await getMilestoneTasks(filters.milestoneId);
      } else if (filters?.projectId) {
        // Fetch all project tasks
        data = await getProjectTasks(filters.projectId);
      } else {
        // Fetch user's tasks
        data = await getUserTasks(filters);
      }

      setTasks(data);
      return data;
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTaskStats = useCallback(async (projectId: number) => {
    try {
      const data = await getProjectTaskStats(projectId);
      setStats(data);
      return data;
    } catch (err) {
      console.error("Error fetching task stats:", err);
      return null;
    }
  }, []);

  const createTask = async (task: Task) => {
    try {
      const data = await cTask(task);
      await fetchTasks({
        projectId: task.project_id,
        milestoneId: task.milestone_id ?? null
      });
      if (task.project_id) {
        await fetchTaskStats(task.project_id);
      }
      return { success: true, data };
    } catch (err) {
      console.error("Error creating task:", err);
      return { success: false, error: err };
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const data = await uTask(task);
      await fetchTasks({
        projectId: task.project_id,
        milestoneId: task.milestone_id ?? null
      });
      if (task.project_id) {
        await fetchTaskStats(task.project_id);
      }
      return { success: true, data };
    } catch (err) {
      console.error("Error updating task:", err);
      return { success: false, error: err };
    }
  };

  const deleteTask = async (taskId: number, projectId?: number, milestoneId?: number) => {
    try {
      await dTask(taskId);
      if (projectId) {
        await fetchTasks({
          projectId,
          milestoneId: milestoneId ?? null
        });
        await fetchTaskStats(projectId);
      }
      return { success: true };
    } catch (err) {
      console.error("Error deleting task:", err);
      return { success: false, error: err };
    }
  };

  const completeTask = async (taskId: number, projectId?: number, milestoneId?: number) => {
    try {
      const data = await cmpTask(taskId);
      if (projectId) {
        await fetchTasks({
          projectId,
          milestoneId: milestoneId ?? null
        });
        await fetchTaskStats(projectId);
      }
      return { success: true, data };
    } catch (err) {
      console.error("Error completing task:", err);
      return { success: false, error: err };
    }
  };

  const reopenTask = async (taskId: number, projectId?: number, milestoneId?: number) => {
    try {
      const data = await ropTask(taskId);
      if (projectId) {
        await fetchTasks({
          projectId,
          milestoneId: milestoneId ?? null
        });
        await fetchTaskStats(projectId);
      }
      return { success: true, data };
    } catch (err) {
      console.error("Error reopening task:", err);
      return { success: false, error: err };
    }
  };

  const updateMilestone = async (taskIds: number[], milestoneId: number | null, projectId: number) => {
    try {
      const data = await updateTasksMilestone(taskIds, milestoneId);
      await fetchTasks({ projectId });
      await fetchTaskStats(projectId);
      return { success: true, data };
    } catch (err) {
      console.error("Error updating task milestone:", err);
      return { success: false, error: err };
    }
  };

  return {
    tasks,
    loading,
    error,
    stats,
    fetchTasks,
    fetchTaskStats,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    updateMilestone,
  };
}
