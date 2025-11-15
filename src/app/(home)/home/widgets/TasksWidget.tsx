'use client';

import React, { useEffect } from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import TaskListSection from '../components/TaskListSection';
import { useTasks, TaskStatus } from "@/hooks/useTasks";
import { useModalState } from "@/app/(home)/home/components/useModalState";
import DetailModals from "@/app/(home)/home/components/DetailModals";

export default function TasksWidget({ config }: WidgetProps) {
  const { tasks, loading, getUserTasks } = useTasks();
  const { selectedTaskId, handleTaskClick, closeTask } = useModalState();

  useEffect(() => {
    getUserTasks(TaskStatus.INCOMPLETE);
  }, []);

  return (
    <>
      {selectedTaskId !== null && (
        <DetailModals
          selectedNoticeId={null}
          selectedTaskId={selectedTaskId}
          onTaskStatusUpdate={() => getUserTasks(TaskStatus.INCOMPLETE)}
          onCloseNotice={() => {}}
          onCloseTask={closeTask}
        />
      )}
      <BaseWidget config={config}>
        <TaskListSection
          tasks={tasks}
          loading={loading}
          onTaskClick={handleTaskClick}
        />
      </BaseWidget>
    </>
  );
}
