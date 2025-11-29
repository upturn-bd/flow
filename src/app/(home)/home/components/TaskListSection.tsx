'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/components/ui/animations';
import { cn } from '@/components/ui/class';
import { formatDateToDayMonth } from '@/lib/utils';
import SectionHeader from './SectionHeader';
import LoadingSection from './LoadingSection';
import EmptyState from './EmptyState';

interface Task {
  id?: string;
  task_title: string;
  end_date: string;
}

interface TaskListSectionProps {
  tasks: Task[];
  loading: boolean;
  onTaskClick: (taskId: string) => void;
}

export default function TaskListSection({
  tasks,
  loading,
  onTaskClick,
}: TaskListSectionProps) {
  
  return (
    <>
      <SectionHeader title="Task List" icon={CheckSquare} />
      
      {loading ? (
        <LoadingSection text="Loading tasks..." icon={CheckSquare} />
      ) : (
        <motion.div
          variants={staggerContainer} 
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  onClick={() => task.id && onTaskClick(task.id)}
                  className="flex items-center justify-between px-4 py-3 bg-background-secondary hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium border border-border-primary cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      new Date(task.end_date) < new Date() ? "bg-red-500" : "bg-green-500"
                    )}></div>
                    <span>{task.task_title}</span>
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
        </div>
      )}
    </>
  );
}
