'use client';

import { useState } from 'react';

export function useModalState() {
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleNoticeClick = (noticeId: number) => {
    setSelectedNoticeId(noticeId);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const closeNotice = () => setSelectedNoticeId(null);
  const closeTask = () => setSelectedTaskId(null);

  return {
    selectedNoticeId,
    selectedTaskId,
    handleNoticeClick,
    handleTaskClick,
    closeNotice,
    closeTask,
  };
}
