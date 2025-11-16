'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, Plus } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/components/ui/animations';
import { cn } from '@/components/ui/class';
import { formatDateToDayMonth } from '@/lib/utils';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import { useTasks, TaskStatus } from '@/hooks/useTasks';
import SectionHeader from '../components/SectionHeader';
import LoadingSection from '../components/LoadingSection';
import EmptyState from '../components/EmptyState';
import { useRouter } from 'next/navigation';

interface TasksWidgetProps extends WidgetProps {
  onTaskClick: (taskId: string) => void;
}

export default function TasksWidget({ config, isEditMode, onToggle, onSizeChange, onTaskClick }: TasksWidgetProps) {
  const router = useRouter();
  const { tasks, loading, getUserTasks } = useTasks();

  useEffect(() => {
    getUserTasks(TaskStatus.INCOMPLETE);
  }, []);

  const handleCreateTask = () => {
    router.push('/ops/tasks');
  };

  return (
    <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
        <div className="p-5 flex-shrink-0">
          <SectionHeader title="Task List" icon={CheckSquare} />
        </div>
        
        {loading ? (
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
              <h3 className="text-sm font-medium text-gray-500">Your Tasks</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateTask}
                className="rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                title="Create new task"
              >
                <Plus size={16} className="text-white" />
              </motion.button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  variants={fadeInUp}
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
                    <Clock size={14} className="text-gray-400" />
                    <span className="whitespace-nowrap text-gray-600">
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
  );
}