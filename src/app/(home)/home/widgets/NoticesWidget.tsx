'use client';

import React, { useEffect, useState } from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import NoticesSection from '../components/NoticesSection';
import { useNotices } from "@/hooks/useNotice";
import { useModalState } from "@/app/(home)/home/components/useModalState";
import DetailModals from "@/app/(home)/home/components/DetailModals";
import { useAuth } from '@/lib/auth/auth-context';
import { NoticeCreateModal } from '@/components/ops/notice';
import { toast } from 'sonner';
import Portal from '@/components/ui/Portal';
import NoPermissionMessage from '@/components/ui/NoPermissionMessage';

export default function NoticesWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const { canRead, canWrite } = useAuth();
  const { notices, loading, fetchNotices, createNotice } = useNotices();
  const { selectedNoticeId, handleNoticeClick, closeNotice } = useModalState();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check permissions
  const canViewNotices = canRead('notice');
  const canCreateNotices = canWrite('notice');

  useEffect(() => {
    if (canViewNotices) {
      fetchNotices();
    }
  }, [canViewNotices]);

  const handleCreateNotice = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleNoticeCreated = async (data: any) => {
    const result = await createNotice(data);
    if (result?.success) {
      toast.success('Notice created successfully!');
      fetchNotices();
      handleCloseCreateModal();
    } else {
      toast.error((result?.error as string) || 'Failed to create notice');
    }
  };

  return (
    <>
      <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
        {!canViewNotices ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
            <NoPermissionMessage moduleName="notices" />
          </div>
        ) : (
          <NoticesSection
            notices={notices}
            loading={loading}
            onNoticeClick={handleNoticeClick}
            onRefresh={() => fetchNotices()}
            canCreate={canCreateNotices}
            onCreateClick={handleCreateNotice}
          />
        )}
      </BaseWidget>
      
      {selectedNoticeId !== null && (
        <Portal>
          <DetailModals
            selectedNoticeId={selectedNoticeId}
            selectedTaskId={null}
            onTaskStatusUpdate={() => {}}
            onCloseNotice={closeNotice}
            onCloseTask={() => {}}
          />
        </Portal>
      )}
      
      {isCreateModalOpen && (
        <Portal>
          <NoticeCreateModal
            onSubmit={handleNoticeCreated}
            onClose={handleCloseCreateModal}
          />
        </Portal>
      )}
    </>
  );
}
