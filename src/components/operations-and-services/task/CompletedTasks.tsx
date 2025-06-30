"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api";
import { getCompanyId } from "@/lib/api";
import { Task } from "@/lib/types/schemas";
import TaskDetails from "./shared/TaskDetails";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ExternalLink, Loader2, CheckCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";

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

  const { id, task_title, department_id, task_description, end_date } = task;

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
    return <LoadingState message="Loading task information..." size="sm" />;
  }

  const department = departments.find((dept) => dept.id === department_id);

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        isLoading={isDeleting}
        className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={14} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => id !== undefined && setTaskDetailsId(id)}
        className="p-2 h-8 w-8 hover:bg-gray-50 hover:text-gray-700"
      >
        <ExternalLink size={14} />
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader
        title={task_title}
        subtitle={task_description}
        icon={<CheckCircle size={20} className="text-green-500" />}
        action={actions}
      />
      
      <CardContent>
        <div className="flex items-center justify-between">
          {department && (
            <StatusBadge status={department.name} variant="info" size="sm" />
          )}
          {end_date && (
            <InfoRow
              icon={<Calendar size={16} />}
              label="Completed"
              value={end_date}
              className="text-xs"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompletedTasksList() {
  const { deleteTask } = useTasks();
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const {tasks, fetchTasks, loading} = useTasks();

  useEffect(() => {
    fetchTasks({all:true,status:false});
  }, []);

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      fetchTasks({all:true,status:false});
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {loading && (
          <LoadingState message="Loading completed tasks..." />
        )}

        {!selectedTask && taskDetailsId === null && !loading && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
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
                <EmptyState
                  icon={<CheckCircle className="w-12 h-12" />}
                  title="No completed tasks"
                  description="Tasks will appear here once they're marked as complete"
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {taskDetailsId !== null && (
          <TaskDetails
            onClose={() => setTaskDetailsId(null)}
            id={taskDetailsId}
            onTaskStatusUpdate={() => fetchTasks({all:true,status:false})}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompletedTasksList;
