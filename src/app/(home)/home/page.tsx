"use client";

import { useAttendanceStatus } from "@/hooks/useAttendance";
import { useSites } from "@/hooks/useAttendanceManagement";
import { useNotices } from "@/hooks/useNotice";
import { useTasks, TaskStatus } from "@/hooks/useTasks";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import SectionContainer from "@/app/(home)/home/components/SectionContainer";
import NoticesSection from "@/app/(home)/home/components/NoticesSection";
import AttendanceSection from "@/app/(home)/home/components/AttendanceSection";
import TaskListSection from "@/app/(home)/home/components/TaskListSection";
import DetailModals from "@/app/(home)/home/components/DetailModals";
import { handleCheckIn, handleCheckOut } from "@/app/(home)/home/components/attendanceUtils";
import { pageVariants, sectionVariants } from "@/app/(home)/home/components/animations";
import { useModalState } from "@/app/(home)/home/components/useModalState";

const initialAttendanceRecord: { tag: string; site_id: number | undefined } = {
  tag: "Present",
  site_id: undefined,
};

export default function HomePage() {
  const [attendanceRecord, setAttendanceRecord] = useState(initialAttendanceRecord);
  const [processing, setProcessing] = useState(false); // block button clicks while updating

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
  const [attendanceLoading, setAttendanceLoading] = useState(false)


  const currentAttendanceRecord = today;

  // Derived attendance status
  const attendanceStatus = useMemo(() => ({
    checkIn: !!today?.check_in_time,
    checkOut: !!today?.check_out_time,
  }), [today]);

  // Fetch initial data
  useEffect(() => {
    fetchSites();
    fetchNotices();
    getUserTasks(TaskStatus.INCOMPLETE);
    getTodaysAttendance();
  }, []);

  // Check-in handler
  const onCheckIn = async () => {
    setAttendanceLoading(true)
    setProcessing(true);
    try {
      await handleCheckIn(attendanceRecord, sites, getTodaysAttendance);
    } finally {
      setProcessing(false);
      setAttendanceLoading(false)
    }
  };

  // Check-out handler
  const onCheckOut = async () => {
    setAttendanceLoading(true)
    setProcessing(true);
    console.log(today)
    try {
      if (today?.id) {
        await handleCheckOut(today.id);
      }
    } finally {
      setProcessing(false);
      setAttendanceLoading(false)

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
          className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-4xl mx-auto"
        >
          {/* News & Reminder */}
          <SectionContainer variants={sectionVariants}>
            <NoticesSection
              notices={notices}
              loading={noticesLoading}
              onNoticeClick={handleNoticeClick}
              onRefresh={() => fetchNotices()}
            />
          </SectionContainer>

          {/* Attendance */}
          <SectionContainer variants={sectionVariants}>
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
          </SectionContainer>

          {/* Task List */}
          <SectionContainer variants={sectionVariants}>
            <TaskListSection
              tasks={tasks}
              loading={tasksLoading}
              onTaskClick={handleTaskClick}
            />
          </SectionContainer>
        </motion.div>
      )}
    </>
  );
}
