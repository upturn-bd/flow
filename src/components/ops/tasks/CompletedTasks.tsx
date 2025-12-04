"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { Task, TaskStatus, useTasks } from "@/hooks/useTasks";
import { useEffect, useState, memo, useCallback } from "react";
import { Department } from "@/lib/types/schemas";
import TaskDetails from "./shared/TaskDetails";
import { motion, AnimatePresence } from "framer-motion";
import { Trash, ExternalLink, CheckCircle, Calendar } from "@/lib/icons";
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
import { useRouter } from "next/navigation";
import LoadMore from "@/components/ui/LoadMore";
import { debounce } from "lodash"; // For debouncing search
import { useAuth } from "@/lib/auth/auth-context";
import { PERMISSION_MODULES } from "@/lib/constants";
import { PermissionTooltip } from "@/components/permissions";

function TaskCard({
  adminScoped,
  userId,
  task,
  setTaskDetailsId,
  deleteTask,
  departments,
  onDetails
}: {
  adminScoped: boolean,
  userId?: string,
  task: Task;
  setTaskDetailsId?: (id: string) => void;
  deleteTask: (id: string) => void;
  departments: Department[];
  onDetails: () => void
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { canDelete, isAdmin } = useAuth();

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

  // Check if user can delete based on permissions OR ownership
  const canDeleteTask = canDelete(PERMISSION_MODULES.TASKS) || userId === task.created_by || (adminScoped && isAdmin());

  const actions = (
    <div className="flex items-center gap-2">
      {canDeleteTask && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          isLoading={isDeleting}
          className="p-2 h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash size={14} />
        </Button>
      )}

      {!canDeleteTask && (userId === task.created_by || (adminScoped && isAdmin())) && (
        <PermissionTooltip message="You don't have permission to delete tasks">
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="p-2 h-8 w-8 opacity-50 cursor-not-allowed"
          >
            <Trash size={14} />
          </Button>
        </PermissionTooltip>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onDetails}
        className="p-2 h-8 w-8 hover:bg-background-secondary dark:hover:bg-background-tertiary hover:text-foreground-primary"
      >
        <ExternalLink size={14} />
      </Button>
    </div>
  );

  return (
    <Card data-testid="task-card">
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
  deleteTask: (taskId: string, projectId?: string, milestoneId?: number, adminScoped?: boolean) => Promise<{ success: boolean; error?: any; }>;
  hasMoreCompletedTasks: boolean;
  onLoadMore: () => void;
}

const CompletedTasksList = memo(({
  adminScoped = false,
  tasks,
  loading,
  deleteTask,
  hasMoreCompletedTasks,
  onLoadMore
}: CompletedTasksListProps) => {
  const [taskDetailsId, setTaskDetailsId] = useState<string | null>(null);

  const { departments, fetchDepartments, loading: departmentsLoading } = useDepartments();
  const { searchCompletedTasks } = useTasks();

  const [userId, setUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [searching, setSearching] = useState(false);

  const router = useRouter();

  const userIdInit = async () => {
    const user = await getEmployeeInfo();
    setUserId(user.id);
  }

  useEffect(() => {
    userIdInit();
    fetchDepartments();
  }, []);

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id, undefined, undefined, adminScoped);
    } catch (error) {
      console.error(error);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const results = await searchCompletedTasks(term, 20, adminScoped);
      setSearchResults(results);
      setSearching(false);
    }, 300),
    [adminScoped]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const displayTasks = searchTerm ? searchResults : tasks;
  const [showEmpty, setShowEmpty] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (displayTasks.length === 0 && !loading && !searching) {
      timer = setTimeout(() => setShowEmpty(true), 1000);
    } else {
      setShowEmpty(false);
    }
    return () => clearTimeout(timer);
  }, [displayTasks.length, loading, searching]);

  if (loading || departmentsLoading) {
    return (
      <AnimatePresence mode="wait">
        <LoadingSpinner text="Loading completed tasks..." />
      </AnimatePresence>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search completed tasks..."
          className="w-full border border-border-primary rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary-300 bg-surface-primary text-foreground-primary"
        />
      </div>

      <motion.div
        key="content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-4"
      >
        {displayTasks.length > 0 ? (
          displayTasks.map((task) => (
            <div key={task.id}>
              <TaskCard
                adminScoped={adminScoped}
                userId={userId}
                deleteTask={handleDeleteTask}
                task={task}
                departments={departments}
                onDetails={() => router.push(`/ops/tasks/${task.id}`)}
              />

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
          showEmpty && (
            <EmptyState
              icon={<CheckCircle className="w-12 h-12" />}
              title="No completed tasks"
              description="Tasks will appear here once they're marked as complete"
            />
          )
        )}

        {!searchTerm && (
          <LoadMore
            onLoadMore={onLoadMore}
            hasMore={hasMoreCompletedTasks}
          />
        )}
      </motion.div>
    </div>
  );
});

export default CompletedTasksList;
