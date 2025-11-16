'use client';

import React, { useEffect, useState, useMemo } from 'react';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import AttendanceSection from '../components/AttendanceSection';
import { useAttendanceStatus } from "@/hooks/useAttendance";
import { useSites } from "@/hooks/useAttendanceManagement";
import { handleCheckIn, handleCheckOut } from "@/app/(home)/home/components/attendanceUtils";

const initialAttendanceRecord: { tag: string; site_id: number | undefined } = {
  tag: "Present",
  site_id: undefined,
};

export default function AttendanceWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const [attendanceRecord, setAttendanceRecord] = useState(initialAttendanceRecord);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  
  const { today, todayLoading, getTodaysAttendance } = useAttendanceStatus();
  const { sites, loading: sitesLoading, fetchSites } = useSites();

  // Derived attendance status
  const attendanceStatus = useMemo(() => ({
    checkIn: !!today?.check_in_time,
    checkOut: !!today?.check_out_time,
  }), [today]);

  // Fetch initial data
  useEffect(() => {
    fetchSites();
    getTodaysAttendance();
  }, []);

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
    </BaseWidget>
  );
}
