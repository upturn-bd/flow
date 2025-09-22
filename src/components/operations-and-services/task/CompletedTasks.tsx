"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks, TaskStatus } from "@/hooks/useTasks";
import { useEffect, useState, memo, useRef } from "react";
import { Task } from "@/lib/types/schemas";
import { Department } from "@/lib/types/schemas";
import TaskDetails from "./shared/TaskDetails";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ExternalLink, CheckCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardContent,
  StatusBadge,
  InfoRow,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui";

function TaskCard({
  task,
  setTaskDetailsId,
  deleteTask,
  departments,
}: {
  task: Task;
  setTaskDetailsId: (id: number) => void;
  setSelectedTask: (Task: Task) => void;
  deleteTask: (id: number) => void;
  departments: Department[];
}) {
  const [isDeleting, setIsDeleting] = useState(false);

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

const CompletedTasksList = memo(() => {
  // Single hook call to avoid multiple instances
  const { tasks, getCompanyTasks, loading, deleteTask } = useTasks();
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Move employee and department fetching to parent level to avoid multiple API calls
  const { fetchEmployees, loading: employeeLoading } = useEmployees();
  const { departments, fetchDepartments, loading: departmentsLoading } = useDepartments();

  // Use individual useEffects with empty dependencies to prevent re-renders
  useEffect(() => {
    getCompanyTasks(TaskStatus.COMPLETE);
  }, []); // Empty dependency array

  useEffect(() => {
    fetchEmployees();
  }, []); // Empty dependency array

  useEffect(() => {
    fetchDepartments();
  }, []); // Empty dependency array

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      // getCompanyTasks(TaskStatus.COMPLETE); // Removed: useTasks hook handles state update automatically
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || employeeLoading || departmentsLoading) {
    return (
      <AnimatePresence mode="wait">
        <LoadingSpinner text="Loading completed tasks..." />
      </AnimatePresence>
    );
  }

  return (
    <div>
      {!selectedTask && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-4"
        >
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id}>
                <TaskCard
                  deleteTask={handleDeleteTask}
                  setSelectedTask={setSelectedTask}
                  task={task}
                  setTaskDetailsId={setTaskDetailsId}
                  departments={departments}
                />

                {/* Show TaskDetails right below the clicked TaskCard */}
                <AnimatePresence>
                  {taskDetailsId === task.id && (
                    <TaskDetails
                      onClose={() => setTaskDetailsId(null)}
                      id={taskDetailsId}
                      onTaskStatusUpdate={() => { }}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<CheckCircle className="w-12 h-12" />}
              title="No completed tasks"
              description="Tasks will appear here once they're marked as complete"
            />
          )}
        </motion.div>
      )}
    </div>
  );
});

export default CompletedTasksList;
