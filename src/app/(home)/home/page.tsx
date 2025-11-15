"use client";

import { useAttendanceStatus } from "@/hooks/useAttendance";
import { useSites } from "@/hooks/useAttendanceManagement";
import { useNotices } from "@/hooks/useNotice";
import { useTasks, TaskStatus } from "@/hooks/useTasks";
import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import DetailModals from "@/app/(home)/home/components/DetailModals";
import { handleCheckIn, handleCheckOut } from "@/app/(home)/home/components/attendanceUtils";
import { pageVariants } from "@/app/(home)/home/components/animations";
import { useModalState } from "@/app/(home)/home/components/useModalState";
import { useHomeLayout } from "@/hooks/useHomeLayout";
import { getWidgetDefinition } from "@/app/(home)/home/widgets/widgetRegistry";
import AttendanceWidget from "@/app/(home)/home/widgets/AttendanceWidget";
import NoticesWidget from "@/app/(home)/home/widgets/NoticesWidget";
import TasksWidget from "@/app/(home)/home/widgets/TasksWidget";
import ProjectsWidget from "@/app/(home)/home/widgets/ProjectsWidget";
import StakeholderIssuesWidget from "@/app/(home)/home/widgets/StakeholderIssuesWidget";

const initialAttendanceRecord: { tag: string; site_id: number | undefined } = {
  tag: "Present",
  site_id: undefined,
};

export default function HomePage() {
  const { employeeInfo } = useAuth();
  const [attendanceRecord, setAttendanceRecord] = useState(initialAttendanceRecord);
  const [processing, setProcessing] = useState(false);

  const {
    selectedNoticeId,
    selectedTaskId,
    handleNoticeClick,
    handleTaskClick,
    closeNotice,
    closeTask,
  } = useModalState();

  const { today, todayLoading, getTodaysAttendance } = useAttendanceStatus();
  const { sites, loading: sitesLoading, fetchSites } = useSites();
  const { notices, loading: noticesLoading, fetchNotices } = useNotices();
  const { tasks, loading: tasksLoading, getUserTasks } = useTasks();
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Load home layout configuration
  const { layout, loading: layoutLoading } = useHomeLayout();

  // Derived attendance status
  const attendanceStatus = useMemo(() => ({
    checkIn: !!today?.check_in_time,
    checkOut: !!today?.check_out_time,
  }), [today]);

  // Fetch initial data - only when employeeInfo is available
  useEffect(() => {
    if (!employeeInfo) return;
    
    fetchSites();
    fetchNotices();
    getUserTasks(TaskStatus.INCOMPLETE);
    getTodaysAttendance();
  }, [employeeInfo]);

  // Check-in handler
  const onCheckIn = async () => {
    setAttendanceLoading(true);
    setProcessing(true);
    try {
      await handleCheckIn(attendanceRecord, sites, getTodaysAttendance);
    } finally {
      setProcessing(false);
      setAttendanceLoading(false);
    }
  };

  // Check-out handler
  const onCheckOut = async () => {
    setAttendanceLoading(true);
    setProcessing(true);
    try {
      if (today?.id) {
        await handleCheckOut(today.id);
      }
    } finally {
      setProcessing(false);
      setAttendanceLoading(false);
    }
  };

  // Render widget based on type
  const renderWidget = (widgetConfig: any) => {
    if (!widgetConfig.enabled) return null;

    const widgetDef = getWidgetDefinition(widgetConfig.type);
    if (!widgetDef) return null;

    const key = widgetConfig.id;

    switch (widgetConfig.type) {
      case 'attendance':
        return (
          <AttendanceWidget
            key={key}
            config={widgetConfig}
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
        );
      case 'notices':
        return (
          <NoticesWidget
            key={key}
            config={widgetConfig}
            notices={notices}
            loading={noticesLoading}
            onNoticeClick={handleNoticeClick}
            onRefresh={() => fetchNotices()}
          />
        );
      case 'tasks':
        return (
          <TasksWidget
            key={key}
            config={widgetConfig}
            tasks={tasks}
            loading={tasksLoading}
            onTaskClick={handleTaskClick}
          />
        );
      case 'projects':
        return <ProjectsWidget key={key} config={widgetConfig} />;
      case 'stakeholder-issues':
        return <StakeholderIssuesWidget key={key} config={widgetConfig} />;
      default:
        return null;
    }
  };

  return (
    <>
      <DetailModals
        selectedNoticeId={selectedNoticeId}
        selectedTaskId={selectedTaskId}
        onTaskStatusUpdate={() => getUserTasks(TaskStatus.INCOMPLETE)}
        onCloseNotice={closeNotice}
        onCloseTask={closeTask}
      />

      {selectedNoticeId === null && selectedTaskId === null && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={pageVariants}
          className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl mx-auto">
            {layoutLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading dashboard...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {layout?.widgets
                  .filter(w => w.enabled)
                  .sort((a, b) => a.order - b.order)
                  .map(widgetConfig => renderWidget(widgetConfig))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
