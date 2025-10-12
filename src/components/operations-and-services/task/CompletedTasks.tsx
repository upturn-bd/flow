"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { TaskFilters } from "@/hooks/useTasks";
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
import { formatDate } from "@/lib/utils";
import { getEmployeeInfo } from "@/lib/utils/auth";

function TaskCard({
  adminScoped,
  userId,
  userRole,
  task,
  setTaskDetailsId,
  deleteTask,
  departments
}: {
  adminScoped: boolean,
  userId?: string,
  userRole?: string,
  task: Task;
  setTaskDetailsId: (id: number) => void;
  setSelectedTask: (Task: Task) => void;
  deleteTask: (id: number) => void;
  departments: Department[];
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const { id, task_title, department_id, task_description, updated_at } = task;

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
      {(userId === task.created_by || (adminScoped && userRole === "Admin")) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          isLoading={isDeleting}
          className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </Button>
      )}

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
          {updated_at && (
            <InfoRow
              icon={<Calendar size={16} />}
              label="Completed"
              value={formatDate(updated_at)}
              className="text-xs"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CompletedTasksListProps {
  adminScoped: boolean;
  tasks: Task[];
  loading: boolean;
  deleteTask: (taskId: number, projectId?: number, milestoneId?: number, adminScoped?: boolean) => Promise<{ success: boolean; error?: any; }>;
}

const CompletedTasksList = memo(({
  adminScoped=false,
  tasks,
  loading,
  deleteTask,
}: CompletedTasksListProps) => {
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Move employee and department fetching to parent level to avoid multiple API calls
  const { fetchEmployees, loading: employeeLoading } = useEmployees();
  const { departments, fetchDepartments, loading: departmentsLoading } = useDepartments();
  const [userId, setUserId] = useState<string>('')
  const [userRole, setUserRole] = useState<string>("")

  const userIdInit = async () => {
    const user = await getEmployeeInfo()
    setUserId(user.id)
    setUserRole(user.role)
  }

  useEffect(() => {
    userIdInit()
  }, [])

  useEffect(() => {
    fetchEmployees();
  }, []); // Empty dependency array

  useEffect(() => {
    fetchDepartments();
  }, []); // Empty dependency array

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id, undefined, undefined, adminScoped);
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
                adminScoped={adminScoped}
                userId={userId}
                userRole={userRole}
                  deleteTask={handleDeleteTask}
                  setSelectedTask={setSelectedTask}
                  task={task}
                  setTaskDetailsId={setTaskDetailsId}
                  departments={departments}
                />

                {/* Show TaskDetails right below the clicked TaskCard */}
                <AnimatePresence>
                  {taskDetailsId === task.id && taskDetailsId !== null && (
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
