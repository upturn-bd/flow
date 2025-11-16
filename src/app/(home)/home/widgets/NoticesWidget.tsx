'use client';

import React, { useEffect, useState } from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import NoticesSection from '../components/NoticesSection';
import { useNotices } from "@/hooks/useNotice";
import { useModalState } from "@/app/(home)/home/components/useModalState";
import DetailModals from "@/app/(home)/home/components/DetailModals";

export default function NoticesWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const { notices, loading, fetchNotices } = useNotices();
  const { selectedNoticeId, handleNoticeClick, closeNotice } = useModalState();

  useEffect(() => {
    fetchNotices();
  }, []);

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
        />
      </BaseWidget>
    </>
  );
}
