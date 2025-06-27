import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/api";
import { Task } from "@/lib/types";

export interface TaskFilters {
  projectId?: number;
  milestoneId?: number | null;
  status?: boolean;
}

// Get all tasks assigned to user or in their department
export async function getUserTasks(filters?: TaskFilters) {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();

  let query = supabase
    .from("task_records")
    .select("*")
    .eq("company_id", company_id)
    .or(
      `assignees.cs.{${user.id}}, created_by.eq.${user.id}, department_id.eq.${user.department_id}`
    );

  if (filters?.status !== undefined) {
    query = query.eq("status", filters.status);
  } else {
    query = query.eq("status", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Get tasks for a specific project
export async function getProjectTasks(projectId: number, includeCompleted: boolean = false) {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();

  let query = supabase
    .from("task_records")
    .select("*")
    .eq("company_id", company_id)
    .eq("project_id", projectId);

  if (!includeCompleted) {
    query = query.eq("status", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Get tasks for a specific milestone
export async function getMilestoneTasks(milestoneId: number, includeCompleted: boolean = false) {
  const company_id = await getCompanyId();

  let query = supabase
    .from("task_records")
    .select("*")
    .eq("company_id", company_id)
    .eq("milestone_id", milestoneId);

  if (!includeCompleted) {
    query = query.eq("status", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Get a single task by ID
export async function getTaskById(taskId: number) {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("task_records")
    .select("*")
    .eq("company_id", company_id)
    .eq("id", taskId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTask(payload: Task) {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();

  const finalData = {
    ...payload,
    created_by: user.id,
    company_id
  };

  const { data, error } = await supabase
    .from("task_records")
    .insert(
      finalData
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(payload: Task) {
  const company_id = await getCompanyId();

  const finalData = {
    ...payload,
  };

  // Remove undefined values
  Object.keys(finalData).forEach(key => {
    if (finalData[key as keyof typeof finalData] === undefined || finalData[key as keyof typeof finalData] === null) {
      delete finalData[key as keyof typeof finalData];
    }
  });

  const { data, error } = await supabase
    .from("task_records")
    .update(finalData)
    .eq("id", payload.id)
    .eq("company_id", company_id)
    .select()
    .single();

    console.log("Update task response:", data, error);
    

  if (error) throw error;
  return data;
}

export async function deleteTask(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("task_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}

// Mark a task as complete
export async function completeTask(taskId: number) {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();

  const { data, error } = await supabase
    .from("task_records")
    .update({
      status: true,
      completed_by: user.id,
      completed_at: new Date().toISOString()
    })
    .eq("id", taskId)
    .eq("company_id", company_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Reopen a completed task
export async function reopenTask(taskId: number) {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("task_records")
    .update({
      status: false,
      completed_by: null,
      completed_at: null
    })
    .eq("id", taskId)
    .eq("company_id", company_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Bulk update task milestone
export async function updateTasksMilestone(taskIds: number[], milestoneId: number | null) {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();

  const { data, error } = await supabase
    .from("task_records")
    .update({
      milestone_id: milestoneId,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .in("id", taskIds)
    .eq("company_id", company_id)
    .select();

  if (error) throw error;
  return data;
}

// Get task statistics for a project
export async function getProjectTaskStats(projectId: number) {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("task_records")
    .select("status, milestone_id")
    .eq("company_id", company_id)
    .eq("project_id", projectId);

  if (error) throw error;

  const stats = {
    total: data.length,
    completed: data.filter(t => t.status).length,
    unassigned: data.filter(t => t.milestone_id === null).length,
    inProgress: data.filter(t => !t.status).length
  };

  return stats;
}
