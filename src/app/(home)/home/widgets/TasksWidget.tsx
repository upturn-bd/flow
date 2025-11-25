'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, Plus } from '@/lib/icons';
import { staggerContainer, fadeInUp } from '@/components/ui/animations';
import { cn } from '@/components/ui/class';
import { formatDateToDayMonth } from '@/lib/utils';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import { useTasks, TaskStatus } from '@/hooks/useTasks';
import SectionHeader from '../components/SectionHeader';
import LoadingSection from '../components/LoadingSection';
import EmptyState from '../components/EmptyState';
import { useAuth } from '@/lib/auth/auth-context';
import TaskCreateModal from '@/components/ops/tasks/shared/TaskCreateModal';
import { toast } from 'sonner';
import Portal from '@/components/ui/Portal';
import NoPermissionMessage from '@/components/ui/NoPermissionMessage';

interface TasksWidgetProps extends WidgetProps {
  onTaskClick: (taskId: string) => void;
}

export default function TasksWidget({ config, isEditMode, onToggle, onSizeChange, onTaskClick }: TasksWidgetProps) {
  const { canRead, canWrite } = useAuth();
  const { tasks, loading, getUserTasks, createTask } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check permissions
  const canViewTasks = canRead('tasks');
  const canCreateTasks = canWrite('tasks');

  useEffect(() => {
    if (canViewTasks) {
      getUserTasks(TaskStatus.INCOMPLETE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewTasks]);

  const handleCreateTask = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleTaskCreated = async (data: any) => {
    const result = await createTask(data);
    if (result?.success) {
      toast.success('Task created successfully!');
      getUserTasks(TaskStatus.INCOMPLETE);
      handleCloseModal();
    } else {
      toast.error((result?.error as string) || 'Failed to create task');
    }
  };

  return (
    <>
    <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
      <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary h-full flex flex-col overflow-hidden">
        <div className="p-5 flex-shrink-0">
          <SectionHeader title="Task List" icon={CheckSquare} />
        </div>
        
        {!canViewTasks ? (
          <NoPermissionMessage moduleName="tasks" />
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <LoadingSection text="Loading tasks..." icon={CheckSquare} />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="px-5 pb-5 flex-1 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-sm font-medium text-foreground-secondary">Your Tasks</h3>
              {canCreateTasks && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateTask}
                  className="rounded-full p-2 bg-primary-600 hover:bg-primary-700 transition-colors"
                  title="Create new task"
                >
                  <Plus size={16} className="text-white" />
                </motion.button>
              )}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  variants={fadeInUp}
                  onClick={() => task.id && onTaskClick(task.id)}
                  className="flex items-center justify-between px-4 py-3 bg-background-secondary hover:bg-surface-hover rounded-lg transition-colors text-sm font-medium border border-border-primary cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      new Date(task.end_date) < new Date() ? "bg-red-500" : "bg-green-500"
                    )}></div>
                    <span className="text-foreground-primary">{task.task_title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-foreground-tertiary" />
                    <span className="whitespace-nowrap text-foreground-secondary">
                      {formatDateToDayMonth(task.end_date)}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <EmptyState icon={CheckSquare} message="No tasks available at this time" />
              )}
            </div>
          </motion.div>
        )}
      </div>
    </BaseWidget>
    
    {isModalOpen && (
      <Portal>
        <TaskCreateModal
          onSubmit={handleTaskCreated}
          onClose={handleCloseModal}
        />
      </Portal>
    )}
    </>
  );
}