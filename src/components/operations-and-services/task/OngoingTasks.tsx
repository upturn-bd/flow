"use client";
import {
  TaskUpdateModal,
} from "./shared/TaskModal";
import { useTasks } from "@/hooks/useTasks";
import { Task } from "@/lib/types/schemas";
import { useEffect, useState } from "react";
import TaskDetails from "./shared/TaskDetails";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Trash2, ExternalLink, Loader2, ClipboardList, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardFooter, PriorityBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";

export default function TaskPage() {
  const { tasks, loading, fetchTasks, updateTask, deleteTask } = useTasks();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskDetailsId, setTaskDetailsId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const handleUpdateTask = async (values: any) => {
    try {
      await updateTask(values);
      toast.success("Task updated successfully");
      setEditTask(null);
      fetchTasks({all:true,status:false});
    } catch (error) {
      toast.error("Error updating task");
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      setDeletingTaskId(id);
      await deleteTask(id);
      toast.success("Task deleted successfully");
      fetchTasks({all:true,status:false});
    } catch (error) {
      toast.error("Error deleting task");
      console.error(error);
    } finally {
      setDeletingTaskId(null);
    }
  };

  useEffect(() => {
    fetchTasks({all:true,status:false});
  }, [fetchTasks]);

  return (
    <div>
      {!editTask && taskDetailsId === null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => setEditTask(task)}
                      onDelete={() => task.id !== undefined && handleDeleteTask(task.id)}
                      onDetails={() => task.id !== undefined && setTaskDetailsId(task.id)}
                      isDeleting={deletingTaskId === task.id}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<ClipboardList className="w-12 h-12" />}
                    title="No tasks available"
                    description="Create a new task to get started with your project management."
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
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

function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onDetails, 
  isDeleting = false 
}: { 
  task: Task; 
  onEdit: () => void; 
  onDelete: () => void; 
  onDetails: () => void; 
  isDeleting?: boolean;
}) {
  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="p-2 h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
      >
        <Edit size={14} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        isLoading={isDeleting}
        className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={14} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDetails}
        className="p-2 h-8 w-8 hover:bg-gray-50 hover:text-gray-700"
      >
        <ExternalLink size={14} />
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader
        title={task.task_title}
        subtitle={task.task_description}
        action={actions}
      />
      
      <CardContent>
        <div className="flex items-center justify-between">
          <PriorityBadge priority={task.priority as "High" | "Medium" | "Low"} />
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
