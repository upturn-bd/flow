'use client';

import React from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import AttendanceSection from '../components/AttendanceSection';

interface AttendanceWidgetProps extends WidgetProps {
  loading: boolean;
  attendanceLoading: boolean;
  attendanceStatus: { checkIn: boolean; checkOut: boolean };
  attendanceRecord: { tag: string; site_id: number | undefined };
  sites: any[];
  sitesLoading: boolean;
  onRecordChange: (record: any) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export default function AttendanceWidget({
  config,
  loading,
  attendanceLoading,
  attendanceStatus,
  attendanceRecord,
  sites,
  sitesLoading,
  onRecordChange,
  onCheckIn,
  onCheckOut,
}: AttendanceWidgetProps) {
  return (
    <BaseWidget config={config}>
      <AttendanceSection
        loading={loading}
        attendanceLoading={attendanceLoading}
        attendanceStatus={attendanceStatus}
        attendanceRecord={attendanceRecord}
        sites={sites}
        sitesLoading={sitesLoading}
        onRecordChange={onRecordChange}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
      />
    </BaseWidget>
  );
}
