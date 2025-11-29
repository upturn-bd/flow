'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, Plus } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/components/ui/animations';
import { cn } from '@/components/ui/class';
import { formatDateToDayMonth } from '@/lib/utils';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import { useTasks } from '@/hooks/useTasks';
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
  const { 
    ongoingTasks, 
    completedTasks, 
    ongoingTasksLoading, 
    loading, 
    fetchOngoingTasks, 
    fetchCompletedTasks, 
    createTask 
  } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');

  // Check permissions
  const canViewTasks = canRead('tasks');
  const canCreateTasks = canWrite('tasks');

  useEffect(() => {
    if (canViewTasks) {
      fetchOngoingTasks();
      fetchCompletedTasks();
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
      fetchOngoingTasks();
      handleCloseModal();
    } else {
      toast.error((result?.error as string) || 'Failed to create task');
    }
  };

  const isLoading = ongoingTasksLoading || loading;
  const currentTasks = activeTab === 'ongoing' ? ongoingTasks : completedTasks;

  return (
    <>
    <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
      <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary h-full flex flex-col overflow-hidden">
        <div className="p-5 flex-shrink-0">
          <SectionHeader title="Task List" icon={CheckSquare} />
        </div>
        
        {!canViewTasks ? (
          <NoPermissionMessage moduleName="tasks" />
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <LoadingSection text="Loading tasks..." icon={CheckSquare} />
          </div>
        ) : (
          <div className="px-5 pb-5 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-500">Your Tasks</h3>
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
            {currentTasks.length > 0 ? (
              currentTasks.map((task, index) => (
                <motion.div
                  key={`${activeTab}-${task.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => task.id && onTaskClick(task.id)}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-gray-100 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      new Date(task.end_date) < new Date() ? "bg-red-500" : "bg-green-500"
                    )}></div>
                    <span className="text-gray-900">{task.task_title}</span>
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
              <EmptyState 
                icon={CheckSquare} 
                message={activeTab === 'ongoing' ? "No ongoing tasks" : "No completed tasks"} 
              />
              )}
            </div>
          </div>
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