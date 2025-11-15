'use client';

import React from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import TaskListSection from '../components/TaskListSection';

interface Task {
  id?: string;
  task_title: string;
  end_date: string;
}

interface TasksWidgetProps extends WidgetProps {
  tasks: Task[];
  loading: boolean;
  onTaskClick: (taskId: string) => void;
}

export default function TasksWidget({
  config,
  tasks,
  loading,
  onTaskClick,
}: TasksWidgetProps) {
  return (
    <BaseWidget config={config}>
      <TaskListSection
        tasks={tasks}
        loading={loading}
        onTaskClick={onTaskClick}
      />
    </BaseWidget>
  );
}
