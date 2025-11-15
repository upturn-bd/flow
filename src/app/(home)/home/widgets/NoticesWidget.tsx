'use client';

import React from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import NoticesSection from '../components/NoticesSection';

interface Notice {
  id?: number;
  title: string;
  urgency?: string;
  valid_from?: string;
  valid_till?: string;
}

interface NoticesWidgetProps extends WidgetProps {
  notices: Notice[];
  loading: boolean;
  onNoticeClick: (noticeId: number) => void;
  onRefresh: () => void;
}

export default function NoticesWidget({
  config,
  notices,
  loading,
  onNoticeClick,
  onRefresh,
}: NoticesWidgetProps) {
  return (
    <BaseWidget config={config}>
      <NoticesSection
        notices={notices}
        loading={loading}
        onNoticeClick={onNoticeClick}
        onRefresh={onRefresh}
      />
    </BaseWidget>
  );
}
