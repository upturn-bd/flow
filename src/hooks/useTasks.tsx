"use client";

import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
import { Task } from "@/lib/types/schemas";
import { useState, useCallback, useMemo, useRef } from "react";
import { useNotifications } from "./useNotifications";
import { slugify } from "@/lib/utils";

// Task status variants
export enum TaskStatus {
  INCOMPLETE = "incomplete",
  COMPLETE = "complete",
  ALL = "all"
}

// Task scope variants
export enum TaskScope {
  USER_TASKS = "user_tasks",
  PROJECT_TASKS = "project_tasks",
  MILESTONE_TASKS = "milestone_tasks",
  COMPANY_TASKS = "company_tasks",
  DEPARTMENT_TASKS = "department_tasks"
}

// Simplified filter interface
export interface TaskFilters {
  scope: TaskScope;
  status: TaskStatus;
  projectId?: string;
  milestoneId?: number;
  departmentId?: number;
  assigneeId?: string;
}

// Task fetch result interface
export interface TaskFetchResult {
  tasks: Task[];
  totalCount: number;
  completedCount: number;
  pendingCount: number;
}

// Re-export Task type for components
export type { Task };

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false); // Start with loading true
  const [error, setError] = useState<Error | null>(null);
  const [ongoingTasks, setOngoingTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    unassigned: number;
    inProgress: number;
  } | null>(null);

  // Use ref to track loading state to avoid dependency issues
  const isLoadingRef = useRef(false);

  const { createNotification } = useNotifications();

  // Helper function to apply status filtering to query

  // Unified fetch function that handles all scenarios
  const fetchTasks = useCallback(async (filters: TaskFilters): Promise<TaskFetchResult> => {

    // Prevent duplicate calls while loading using ref
    if (isLoadingRef.current) {
      return { tasks: [], totalCount: 0, completedCount: 0, pendingCount: 0 };
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      let query = supabase
        .from("task_records")
        .select("*")
        .eq("company_id", company_id);

      // Apply scope-specific filters
      switch (filters.scope) {
        case TaskScope.USER_TASKS:
          const user = await getEmployeeInfo();
          query = query.contains("assignees", [user.id]);
          break;
        case TaskScope.PROJECT_TASKS:
          if (filters.projectId) {
            query = query.eq("project_id", filters.projectId);
          }
          break;
        case TaskScope.MILESTONE_TASKS:
          if (filters.milestoneId) {
            query = query.eq("milestone_id", filters.milestoneId);
          }
          break;
        case TaskScope.DEPARTMENT_TASKS:
          if (filters.departmentId) {
            query = query.eq("department_id", filters.departmentId);
          }
          break;
        case TaskScope.COMPANY_TASKS:
          // No additional filtering needed
          break;
        default:
          break;
      }

      // Apply assignee filter if specified
      if (filters.assigneeId) {
        query = query.contains("assignees", [filters.assigneeId]);
      }

      // Apply status filter
      query = ((query: any, status: TaskStatus) => {
        if (status === TaskStatus.INCOMPLETE) {
          return query.eq("status", false);
        } else if (status === TaskStatus.COMPLETE) {
          return query.eq("status", true);
        }
        // TaskStatus.ALL - no filter applied
        return query;
      })(query, filters.status);

      const { data, error } = await query;

      if (error) throw error;

      const result: TaskFetchResult = {
        tasks: data || [],
        totalCount: data?.length || 0,
        completedCount: data?.filter(t => t.status).length || 0,
        pendingCount: data?.filter(t => !t.status).length || 0,
      };

      // Only update state if tasks have actually changed
      setTasks(prevTasks => {
        const newTasks = result.tasks;
        // Simple comparison - if length is different or data is different, update
        if (prevTasks.length !== newTasks.length ||
          JSON.stringify(prevTasks.map(t => t.id).sort()) !== JSON.stringify(newTasks.map(t => t.id).sort())) {
          return newTasks;
        }
        return prevTasks;
      });
      return result;
    } catch (err) {
      console.error("Error fetching tasks:", err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      return { tasks: [], totalCount: 0, completedCount: 0, pendingCount: 0 };
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);





  const [hasMoreOngoingTasks, setHasMoreOngoingTasks] = useState(true);
  const [lastFetchedOngoingTaskId, setLastFetchedOngoingTaskId] = useState<string | null>(null);
  const fetchOngoingTasks = useCallback(
    async (companyScopes = false, limit = 10) => {
      try {
        setLoading(true);
        const user = await getEmployeeInfo();

        let query = supabase
          .from("task_records")
          .select("*")
          .eq("status", false)
          .order("id", { ascending: true }) // pagination cursor
          .limit(limit);

        if (!companyScopes) { 
          query = query.or(`created_by.eq.${user.id},assignees.cs.{${user.id}}`);
        }

        if (lastFetchedOngoingTaskId) {
          // fetch tasks with id greater than last fetched
          query = query.gt("id", lastFetchedOngoingTaskId);
        }

        const { data, error } = await query;


        if (error) throw error;

        if (data.length > 0) {
          setOngoingTasks(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const uniqueNewTasks = data.filter(t => !existingIds.has(t.id));
            return [...prev, ...uniqueNewTasks];
          });;
          setLastFetchedOngoingTaskId(data[data.length - 1].id);
          setHasMoreOngoingTasks(data.length === limit); // if less than limit, no more tasks
        } 

        if (data.length === 0) {
          setHasMoreOngoingTasks(false);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching ongoing tasks:", err);
        setLoading(false);
      }
    },
    [lastFetchedOngoingTaskId]
  );

  // Search ongoing tasks by a search term (task_title or description) using fuzzy search
  const searchOngoingTasks = useCallback(
    async (searchTerm: string, limit = 10, companyScopes = false) => {
      try {
        setLoading(true);
        const user = await getEmployeeInfo();

        // Base query: ongoing tasks
        let query = supabase
          .from("task_records")
          .select("*")
          .eq("status", false)
          .order("id", { ascending: true })
          .limit(limit);

        // Apply company/user scope
        if (!companyScopes) {
          query = query.or(`created_by.eq.${user.id},assignees.cs.{${user.id}}`);
        }

        // Apply search filter (fuzzy search using ilike)
        if (searchTerm.trim() !== "") {
          query = query.or(
            `task_title.ilike.%${searchTerm}%,task_description.ilike.%${searchTerm}%`
          );
        }

        // Cursor pagination
        if (lastFetchedOngoingTaskId) {
          query = query.gt("id", lastFetchedOngoingTaskId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          setOngoingTasks(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const uniqueNewTasks = data.filter(t => !existingIds.has(t.id));
            return [...prev, ...uniqueNewTasks];
          });;
          setLastFetchedOngoingTaskId(data[data.length - 1].id);
          setHasMoreOngoingTasks(data.length === limit);
        } else {
          setHasMoreOngoingTasks(false);
        }

        setLoading(false);
        return data || [];
      } catch (err) {
        console.error("Error searching ongoing tasks:", err);
        setLoading(false);
        return [];
      }
    },
    [lastFetchedOngoingTaskId]
  );




  const [hasMoreCompletedTasks, setHasMoreCompletedTasks] = useState(true);
  const [lastFetchedCompletedTaskId, setLastFetchedCompletedTaskId] = useState<string | null>(null);

  const fetchCompletedTasks = useCallback(
    async (companyScopes = false, limit = 10) => {
      try {
        setLoading(true);
        const user = await getEmployeeInfo();

        // Base query: Completed tasks only
        let query = supabase
          .from("task_records")
          .select("*")
          .eq("status", true)
          .order("id", { ascending: true }) // Order by ID for cursor pagination
          .limit(limit);

        // Apply user-specific filtering unless company scope is true
        if (!companyScopes) {
          query = query.or(`created_by.eq.${user.id},assignees.cs.{${user.id}}`);
        }

        // Apply cursor (fetch tasks with id greater than last fetched)
        if (lastFetchedCompletedTaskId) {
          query = query.gt("id", lastFetchedCompletedTaskId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          setCompletedTasks(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const uniqueNewTasks = data.filter(t => !existingIds.has(t.id));
            return [...prev, ...uniqueNewTasks];
          });;
          setLastFetchedCompletedTaskId(data[data.length - 1].id);
          setHasMoreCompletedTasks(data.length === limit); // if less than limit → no more tasks
        } else {
          setHasMoreCompletedTasks(false);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching completed tasks:", err);
        setLoading(false);
      }
    },
    [lastFetchedCompletedTaskId]
  );

  // Search completed tasks by a search term (task_title or description) using fuzzy search
  const searchCompletedTasks = useCallback(
    async (searchTerm: string, limit = 10, companyScopes = false) => {
      try {
        setLoading(true);
        const user = await getEmployeeInfo();

        // Base query: completed tasks
        let query = supabase
          .from("task_records")
          .select("*")
          .eq("status", true) // completed tasks only
          .order("id", { ascending: true })
          .limit(limit);

        // Apply company/user scope
        if (!companyScopes) {
          query = query.or(`created_by.eq.${user.id},assignees.cs.{${user.id}}`);
        }

        // Apply search filter (fuzzy search using ilike)
        if (searchTerm.trim() !== "") {
          query = query.or(
            `task_title.ilike.%${searchTerm}%,task_description.ilike.%${searchTerm}%`
          );
        }

        // Cursor pagination
        if (lastFetchedCompletedTaskId) {
          query = query.gt("id", lastFetchedCompletedTaskId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          setCompletedTasks(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const uniqueNewTasks = data.filter(t => !existingIds.has(t.id));
            return [...prev, ...uniqueNewTasks];
          });;
          setLastFetchedCompletedTaskId(data[data.length - 1].id);
          setHasMoreCompletedTasks(data.length === limit);
        } else {
          setHasMoreCompletedTasks(false);
        }

        setLoading(false);
        return data || [];
      } catch (err) {
        console.error("Error searching completed tasks:", err);
        setLoading(false);
        return [];
      }
    },
    [lastFetchedCompletedTaskId]
  );



  // Convenience methods for common use cases
  const getUserTasks = useCallback((status: TaskStatus = TaskStatus.INCOMPLETE) => {
    return fetchTasks({ scope: TaskScope.USER_TASKS, status });
  }, [fetchTasks]);

  const getProjectTasks = useCallback((projectId: string, status: TaskStatus = TaskStatus.INCOMPLETE) => {
    return fetchTasks({ scope: TaskScope.PROJECT_TASKS, projectId, status });
  }, [fetchTasks]);

  const getMilestoneTasks = useCallback((milestoneId: number, status: TaskStatus = TaskStatus.INCOMPLETE) => {
    return fetchTasks({ scope: TaskScope.MILESTONE_TASKS, milestoneId, status });
  }, [fetchTasks]);

  const getCompanyTasks = useCallback((status: TaskStatus = TaskStatus.INCOMPLETE) => {
    return fetchTasks({ scope: TaskScope.COMPANY_TASKS, status });
  }, [fetchTasks]);

  const getDepartmentTasks = useCallback((departmentId: number, status: TaskStatus = TaskStatus.INCOMPLETE) => {
    return fetchTasks({ scope: TaskScope.DEPARTMENT_TASKS, departmentId, status });
  }, [fetchTasks]);

  // Get task statistics for a project
  const fetchTaskStats = useCallback(async (projectId: string) => {
    try {
      const result = await fetchTasks({ scope: TaskScope.PROJECT_TASKS, projectId, status: TaskStatus.ALL });

      const statsData = {
        total: result.totalCount,
        completed: result.completedCount,
        unassigned: result.tasks.filter(t => t.milestone_id === null).length,
        inProgress: result.pendingCount
      };

      setStats(statsData);
      return statsData;
    } catch (err) {
      console.error("Error fetching task stats:", err);
      return null;
    }
  }, [fetchTasks]);

  // Get a single task by ID
  const getTaskById = useCallback(async (taskId: string) => {
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("task_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("id", taskId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error fetching task by ID:", err);
      throw err;
    }
  }, []);

  // Create a new task
  const createTask = async (task: Task) => {
    try {
      console.log("Creating task:", task);

      const company_id = await getCompanyId();
      const user = await getEmployeeInfo();

      const taskId = slugify(task.task_title);

      const finalData = {
        ...task,
        id: taskId,
        created_by: user.id,
        company_id
      };

      console.log(finalData)

      // Clean up undefined values


      const { data, error } = await supabase
        .from("task_records")
        .insert(finalData)
        .select()

      if (error) throw error;

      // Refresh tasks after creation
      // if (task.project_id) {
      //   await getProjectTasks(task.project_id, TaskStatus.INCOMPLETE);
      //   await fetchTaskStats(task.project_id);
      // }


      const newTask = data?.[0];
      setTasks(prev => [newTask, ...prev]);

      // Notify assignees if any

      const assignees = task.assignees || [];
      createNotification({
        title: "New Task Assigned",
        message: `A new task "${task.task_title}" has been assigned to you.`,
        priority: task.priority,
        type_id: 3, // Assuming 3 is the type ID for task assignment
        recipient_id: assignees,
        action_url: `/ops/tasks/${newTask?.id}`,
        company_id: company_id,
        department_id: task.department_id
      });

      createNotification({
        title: "New Task Created",
        message: `A new task "${task.task_title}" has been created by ${user.name}.`,
        priority: task.priority,
        type_id: 3, // Assuming 3 is the type ID for task assignment
        recipient_id: [user.supervisor_id].filter(Boolean) as string[],
        action_url: `/ops/tasks/${newTask?.id}`,
        company_id: company_id,
        department_id: task.department_id
      });



      return { success: true, data };
    } catch (err) {
      console.error("Error creating task:", err);
      return { success: false, error: err };
    }
  };

  // Update an existing task
  const updateTask = useCallback(async (task: Task) => {
    try {
      const company_id = await getCompanyId();
      const user = await getEmployeeInfo();

      const finalData = { ...task };

      // Remove undefined values
      Object.keys(finalData).forEach(key => {
        if (finalData[key as keyof typeof finalData] === undefined || finalData[key as keyof typeof finalData] === null) {
          delete finalData[key as keyof typeof finalData];
        }
      });

      const { data, error } = await supabase
        .from("task_records")
        .update(finalData)
        .eq("id", task.id)
        .select()
        .maybeSingle();

      console.log(data)

      if (error) {
        console.log(error)
        throw error
      };

      // Refresh tasks after update
      // if (task.project_id) {
      //   if (task.milestone_id) {
      //     await getMilestoneTasks(task.milestone_id, TaskStatus.INCOMPLETE);
      //   } else {
      //     await getProjectTasks(task.project_id, TaskStatus.INCOMPLETE);
      //   }
      //   await fetchTaskStats(task.project_id);
      // }

      setTasks(prev => prev.map(t => t.id === data.id ? data : t));
      fetchOngoingTasks()
      fetchCompletedTasks()
      const recipients = task.assignees;
      if (user.supervisor_id) {
        recipients.push(user.supervisor_id);
      }
      createNotification({
        title: "Task Updated",
        message: `The task "${task.task_title}" has been updated.`,
        priority: 'normal',
        type_id: 3, // 3 is the type ID for task assignment
        recipient_id: recipients,
        action_url: `/ops/tasks/${task.id}`,
        company_id: company_id,
        department_id: task.department_id
      });


      return { success: true, data };
    } catch (err) {
      console.error("Error updating task:", err);
      return { success: false, error: err };
    }
  }, [getProjectTasks, getMilestoneTasks, fetchTaskStats]);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string, projectId?: string, milestoneId?: number, adminScoped?: boolean) => {
    try {
      const company_id = await getCompanyId();

      const { error } = await supabase
        .from("task_records")
        .delete()
        .eq("id", taskId)
        .eq("company_id", company_id);

      if (error) throw error;

      // Refresh tasks after deletion
      if (projectId) {
        if (milestoneId) {
          await getMilestoneTasks(milestoneId, TaskStatus.INCOMPLETE);
        } else {
          await getProjectTasks(projectId, TaskStatus.INCOMPLETE);
        }
        await fetchTaskStats(projectId);
      }

      setTasks(prev => prev.filter(t => t.id !== taskId));

      if (adminScoped) {
        fetchOngoingTasks(true)
        fetchCompletedTasks(true)

      } else {
        fetchOngoingTasks()
        fetchCompletedTasks()
      }

      return { success: true };
    } catch (err) {
      console.error("Error deleting task:", err);
      return { success: false, error: err };
    }
  }, [getProjectTasks, getMilestoneTasks, fetchTaskStats]);

  // Mark a task as complete
  const completeTask = useCallback(async (taskId: string, projectId?: string, milestoneId?: number) => {
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("task_records")
        .update({ status: true })
        .eq("id", taskId)
        .eq("company_id", company_id)
        .select()
        .single();

      if (error) throw error;

      // Refresh tasks after completion
      if (projectId) {
        if (milestoneId) {
          await getMilestoneTasks(milestoneId, TaskStatus.INCOMPLETE);
        } else {
          await getProjectTasks(projectId, TaskStatus.INCOMPLETE);
        }
        await fetchTaskStats(projectId);
      }

      return { success: true, data };
    } catch (err) {
      console.error("Error completing task:", err);
      return { success: false, error: err };
    }
  }, [getProjectTasks, getMilestoneTasks, fetchTaskStats]);

  // Reopen a completed task
  const reopenTask = useCallback(async (taskId: string, projectId?: string, milestoneId?: number) => {
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("task_records")
        .update({ status: false })
        .eq("id", taskId)
        .eq("company_id", company_id)
        .select()
        .single();

      if (error) throw error;

      // Refresh tasks after reopening
      if (projectId) {
        if (milestoneId) {
          await getMilestoneTasks(milestoneId, TaskStatus.INCOMPLETE);
        } else {
          await getProjectTasks(projectId, TaskStatus.INCOMPLETE);
        }
        await fetchTaskStats(projectId);
      }

      return { success: true, data };
    } catch (err) {
      console.error("Error reopening task:", err);
      return { success: false, error: err };
    }
  }, [getProjectTasks, getMilestoneTasks, fetchTaskStats]);

  // Bulk update task milestone
  const updateMilestone = useCallback(async (taskIds: string[], milestoneId: number | null, projectId: string) => {
    try {
      const company_id = await getCompanyId();
      const user = await getEmployeeInfo();

      const { data, error } = await supabase
        .from("task_records")
        .update({
          milestone_id: milestoneId,
          updated_by: user.id,
          updated_at: new Date().toLocaleDateString('sv-SE')
        })
        .in("id", taskIds)
        .eq("company_id", company_id)
        .select();

      if (error) throw error;

      // Refresh tasks after milestone update
      await getProjectTasks(projectId, TaskStatus.INCOMPLETE);
      await fetchTaskStats(projectId);

      return { success: true, data };
    } catch (err) {
      console.error("Error updating task milestone:", err);
      return { success: false, error: err };
    }
  }, [getProjectTasks, fetchTaskStats]);

  return useMemo(() => ({
    // State
    tasks,
    ongoingTasks,
    completedTasks,
    loading,
    error,
    stats,

    hasMoreOngoingTasks,
    lastFetchedOngoingTaskId,
    searchOngoingTasks,

    hasMoreCompletedTasks,
    lastFetchedCompletedTaskId,
    searchCompletedTasks,

    // Main fetch function
    fetchTasks,
    fetchOngoingTasks,
    fetchCompletedTasks,

    // Convenience methods
    getUserTasks,
    getProjectTasks,
    getMilestoneTasks,
    getCompanyTasks,
    getDepartmentTasks,
    getTaskById,

    // Stats
    fetchTaskStats,

    // CRUD operations
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    updateMilestone,
  }), [
    tasks,
    ongoingTasks,
    completedTasks,
    loading,
    error,
    stats,

    hasMoreOngoingTasks,
    lastFetchedOngoingTaskId,
    searchOngoingTasks,

    hasMoreCompletedTasks,
    lastFetchedCompletedTaskId,
    searchCompletedTasks,



    fetchTasks,
    fetchOngoingTasks,
    fetchCompletedTasks,
    getUserTasks,
    getProjectTasks,
    getMilestoneTasks,
    getCompanyTasks,
    getDepartmentTasks,
    getTaskById,
    fetchTaskStats,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    updateMilestone,
  ]);
}
