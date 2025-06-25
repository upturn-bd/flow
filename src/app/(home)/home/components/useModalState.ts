'use client';

import { useState } from 'react';

export function useModalState() {
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const handleNoticeClick = (noticeId: number) => {
    setSelectedNoticeId(noticeId);
  };

  const handleTaskClick = (taskId: number) => {
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
