'use client';

import React, { useEffect, useState, useMemo } from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import AttendanceSection from '../components/AttendanceSection';
import { useAttendanceStatus } from "@/hooks/useAttendance";
import { useSites } from "@/hooks/useAttendanceManagement";
import { handleCheckIn, handleCheckOut } from "@/app/(home)/home/components/attendanceUtils";
import { useAuth } from '@/lib/auth/auth-context';
import NoPermissionMessage from '@/components/ui/NoPermissionMessage';

const initialAttendanceRecord: { tag: string; site_id: number | undefined } = {
  tag: "Present",
  site_id: undefined,
};

export default function AttendanceWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const { canRead } = useAuth();
  const [attendanceRecord, setAttendanceRecord] = useState(initialAttendanceRecord);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  
  const canViewAttendance = canRead('attendance');
  const { today, todayLoading, getTodaysAttendance } = useAttendanceStatus();
  const { sites, loading: sitesLoading, fetchSites } = useSites();

  // Derived attendance status
  const attendanceStatus = useMemo(() => ({
    checkIn: !!today?.check_in_time,
    checkOut: !!today?.check_out_time,
  }), [today]);

  // Fetch initial data
  useEffect(() => {
    if (canViewAttendance) {
      fetchSites();
      getTodaysAttendance();
    }
  }, [canViewAttendance]);

  // Check-in handler
  const onCheckIn = async () => {
    setAttendanceLoading(true);
    try {
      await handleCheckIn(attendanceRecord, sites, getTodaysAttendance);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Check-out handler
  const onCheckOut = async () => {
    setAttendanceLoading(true);
    try {
      if (today?.id) {
        await handleCheckOut(today.id);
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  return (
    <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
      {!canViewAttendance ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
          <NoPermissionMessage moduleName="attendance" />
        </div>
      ) : (
        <AttendanceSection
          loading={todayLoading}
          attendanceLoading={attendanceLoading}
          attendanceStatus={attendanceStatus}
          attendanceRecord={attendanceRecord}
          sites={sites}
          sitesLoading={sitesLoading}
          onRecordChange={setAttendanceRecord}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
        />
      )}
    </BaseWidget>
  );
}
