'use client';

import React, { useEffect, useState } from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import NoticesSection from '../components/NoticesSection';
import { useNotices } from "@/hooks/useNotice";
import { useModalState } from "@/app/(home)/home/components/useModalState";
import DetailModals from "@/app/(home)/home/components/DetailModals";
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';

export default function NoticesWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const router = useRouter();
  const { employeeInfo } = useAuth();
  const { notices, loading, fetchNotices } = useNotices();
  const { selectedNoticeId, handleNoticeClick, closeNotice } = useModalState();

  // Check if user is admin
  const canCreateNotices = employeeInfo?.role === 'admin';

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = () => {
    router.push('/admin/news-and-notice');
  };

  return (
    <>
      {selectedNoticeId !== null && (
        <DetailModals
          selectedNoticeId={selectedNoticeId}
          selectedTaskId={null}
          onTaskStatusUpdate={() => {}}
          onCloseNotice={closeNotice}
          onCloseTask={() => {}}
        />
      )}
      <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
        <NoticesSection
          notices={notices}
          loading={loading}
          onNoticeClick={handleNoticeClick}
          onRefresh={() => fetchNotices()}
          canCreate={canCreateNotices}
          onCreateClick={handleCreateNotice}
        />
      </BaseWidget>
    </>
  );
}
