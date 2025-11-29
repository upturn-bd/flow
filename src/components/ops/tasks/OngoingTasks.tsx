"use client";
import { TaskUpdateModal } from "./shared/TaskModal";
import { TaskFilters, useTasks } from "@/hooks/useTasks";
import { Task } from "@/lib/types/schemas";
import { useEffect, useState, useCallback, useRef } from "react";
import TaskDetails from "./shared/TaskDetails";
import { AnimatePresence } from "framer-motion";
import {
  Edit,
  Trash,
  ExternalLink,
  ClipboardList,
  Calendar,
} from "@/lib/icons";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardContent,
  PriorityBadge,
  InfoRow,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui";
import { getEmployeeId, getEmployeeInfo } from "@/lib/utils/auth";
import { useRouter } from "next/navigation";
import LoadMore from "@/components/ui/LoadMore";
import Link from "next/link";
import { debounce } from "lodash"; // for debouncing search
import { useAuth } from "@/lib/auth/auth-context";
import { PERMISSION_MODULES } from "@/lib/constants";
import { PermissionTooltip } from "@/components/permissions";

interface OngoingTaskPageProps {
  adminScoped: boolean;
  ongoingTasks: Task[];
  loading: boolean;
  updateTask: (task: Task) => Promise<{ success: boolean; data?: any; error?: any; }>;
  deleteTask: (taskId: string, projectId?: string, milestoneId?: number, adminScoped?: boolean) => Promise<{ success: boolean; error?: any; }>;
  hasMoreOngoingTasks: boolean;
  onLoadMore: () => void;
  loadMoreLoading: boolean;
}

export default function OngoingTaskPage({
  adminScoped = false,
  ongoingTasks,
  loading,
  updateTask,
  deleteTask,
  hasMoreOngoingTasks,
  onLoadMore,
  loadMoreLoading
}: OngoingTaskPageProps) {
  const router = useRouter();
  const { searchOngoingTasks } = useTasks();

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [searching, setSearching] = useState(false);

  const userIdInit = async () => {
    const user = await getEmployeeInfo();
    setUserId(user.id);
    setUserRole(user.role);
  };

  useEffect(() => {
    userIdInit();
  }, []);

  const handleUpdateTask = async (values: any) => {
    try {
      const { data } = await updateTask(values);
      toast.success("Task updated successfully");
      setEditTask(null);
    } catch (error) {
      toast.error("Error updating task");
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setDeletingTaskId(id);
      await deleteTask(id, undefined, undefined, adminScoped);
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Error deleting task");
      console.error(error);
    } finally {
      setDeletingTaskId(null);
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
      const results = await searchOngoingTasks(term, 20, adminScoped);
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

  const displayTasks = searchTerm ? searchResults : ongoingTasks;
  const [showEmpty, setShowEmpty] = useState(false);
  const hasLoadedRef = useRef(false);

  // Track when we've completed the initial load
  useEffect(() => {
    // Mark as loaded when we have tasks OR when loading completes and we've waited a bit
    if (ongoingTasks.length > 0 && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
    } else if (!loading && !hasLoadedRef.current) {
      // Wait 2 seconds to ensure the fetch has actually completed
      const timer = setTimeout(() => {
        hasLoadedRef.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, ongoingTasks.length]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (displayTasks.length === 0 && !loading && !searching) {
      // Delay showing empty state by 1 second
      timer = setTimeout(() => {
        setShowEmpty(true);
      }, 2000);
    } else {
      setShowEmpty(false);
    }

    return () => clearTimeout(timer);
  }, [displayTasks.length, loading, searching]);

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search tasks..."
          className="w-full border border-border-primary rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary-300 bg-surface-primary text-foreground-primary"
        />
      </div>

      {/* Loading / searching spinner */}
      {!editTask && (loading || searching || !hasLoadedRef.current) ? (
        <LoadingSpinner text={searching ? "Searching Tasks..." : "Loading Tasks..."} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayTasks.map((task) => (
            <div key={task.id}>
              <TaskCard
                userId={userId}
                userRole={userRole}
                adminScoped={adminScoped}
                task={task}
                onEdit={() => setEditTask(task)}
                onDelete={() =>
                  task.id !== undefined && handleDeleteTask(task.id)
                }
                isDeleting={deletingTaskId === task.id}
              />
            </div>
          ))}

          {displayTasks.length === 0 && !loading && !searching && hasLoadedRef.current && (
            <EmptyState
              icon={<ClipboardList className="w-12 h-12" />}
              title="No tasks found"
              description="Try a different keyword to search tasks."
            />
          )}

          {!searchTerm && (!loading && !searching) && displayTasks.length > 0 && (
            <LoadMore
              isLoading={loadMoreLoading}
              onLoadMore={onLoadMore}
              hasMore={hasMoreOngoingTasks}
            />
          )}
        </div>
      )}

      <AnimatePresence>
        {editTask && (
          <TaskUpdateModal
            onSubmit={handleUpdateTask}
            onClose={() => setEditTask(null)}
            initialData={{
              id: editTask.id,
              task_title: editTask.task_title,
              task_description: editTask.task_description,
              start_date: editTask.start_date,
              end_date: editTask.end_date,
              priority: editTask.priority,
              status: editTask.status || false,
              project_id: editTask.project_id,
              milestone_id: editTask.milestone_id,
              department_id: editTask.department_id,
              assignees: editTask.assignees,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// TaskCard remains the same
function TaskCard({
  adminScoped,
  userId,
  userRole,
  task,
  onEdit,
  onDelete,
  onDetails,
  isDeleting = false,
}: {
  adminScoped: boolean,
  userId: string;
  userRole?: string;
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onDetails?: () => void;
  isDeleting?: boolean;
}) {
  const { canWrite, canDelete } = useAuth();

  // Check if user can edit based on permissions OR ownership
  const canEditTask = canWrite(PERMISSION_MODULES.TASKS) || userId === task.created_by || (adminScoped && userRole === "Admin");
  const canDeleteTask = canDelete(PERMISSION_MODULES.TASKS) || userId === task.created_by || (adminScoped && userRole === "Admin");

  const actions = (
    <div className="flex items-center gap-2 task-card">
      {canEditTask && (
        <Button
          data-testid="edit-task-button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="p-2 h-8 w-8 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <Edit size={14} />
        </Button>
      )}

      {!canEditTask && (userId === task.created_by || (adminScoped && userRole === "Admin")) && (
        <PermissionTooltip message="You don't have permission to edit tasks">
          <Button
            data-testid="edit-task-button"
            variant="ghost"
            size="sm"
            disabled
            className="p-2 h-8 w-8 opacity-50 cursor-not-allowed"
          >
            <Edit size={14} />
          </Button>
        </PermissionTooltip>
      )}

      {canDeleteTask && (
        <Button
          data-testid="delete-task-button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          isLoading={isDeleting}
          className="p-2 h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600"
        >
          <Trash size={14} />
        </Button>
      )}

      {!canDeleteTask && (userId === task.created_by || (adminScoped && userRole === "Admin")) && (
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

      <Link href={`/ops/tasks/${task.id}`}>
        <Button
          data-testid="view-task-button"
          variant="ghost"
          size="sm"
          onClick={onDetails}
          className="p-2 h-8 w-8 hover:bg-background-secondary dark:hover:bg-background-tertiary hover:text-foreground-primary view-button"
        >
          <ExternalLink size={14} />
        </Button>
      </Link>
    </div>
  );

  return (
    <Card data-testid="task-card">
      <CardHeader
        title={task.task_title}
        subtitle={task.task_description}
        action={actions}
      />
      <CardContent>
        <div className="flex items-center justify-between">
          <PriorityBadge
            priority={task.priority as "urgent" | "high" | "normal" | "low"}
          />
          {task.end_date && (
            <InfoRow
              icon={<Calendar size={16} />}
              label="Due"
              value={task.end_date}
              className="text-xs"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
