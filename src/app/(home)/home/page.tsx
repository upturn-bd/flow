"use client";

import { useAttendanceStatus } from "@/hooks/useAttendance";
import { useSites } from "@/hooks/useAttendanceManagement";
import { useNotices } from "@/hooks/useNotice";
import { useTasks } from "@/hooks/useTasks";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionContainer from "@/app/(home)/home/components/SectionContainer";
import NewsReminderSection from "@/app/(home)/home/components/NewsReminderSection";
import AttendanceSection from "@/app/(home)/home/components/AttendanceSection";
import TaskListSection from "@/app/(home)/home/components/TaskListSection";
import DetailModals from "@/app/(home)/home/components/DetailModals";
import { handleCheckIn, handleCheckOut } from "@/app/(home)/home/components/attendanceUtils";
import { pageVariants, sectionVariants } from "@/app/(home)/home/components/animations";
import { useModalState } from "@/app/(home)/home/components/useModalState";


const initialAttendanceRecord: {
  tag: string;
  site_id: number | undefined;
} = {
  tag: "Present",
  site_id: undefined,
};

export default function HomePage() {
  const [attendanceRecord, setAttendanceRecord] = useState(
    initialAttendanceRecord
  );
  
  const {
    selectedNoticeId,
    selectedTaskId,
    handleNoticeClick,
    handleTaskClick,
    closeNotice,
    closeTask,
  } = useModalState();

  const {
    items: attendanceRecords,
    loading: statusLoading,
    fetchItems: checkAttendanceStatus,
  } = useAttendanceStatus();
  const { sites, loading: sitesLoading, fetchSites } = useSites();
  const { notices, loading: noticesLoading, fetchNotices } = useNotices();
  const { tasks, loading: tasksLoading, fetchTasks } = useTasks();

  // Create attendance status from records
  const currentAttendanceRecord = attendanceRecords[0] || null;
  const attendanceStatus = {
    checkIn: !!currentAttendanceRecord?.check_in_time,
    checkOut: !!currentAttendanceRecord?.check_out_time,
  };

  useEffect(() => {
    fetchSites();
    fetchNotices();
    fetchTasks();
  }, [fetchSites, fetchNotices, fetchTasks]);

  const onCheckIn = () => {
    handleCheckIn(attendanceRecord, sites, checkAttendanceStatus);
  };

  const onCheckOut = () => {
    handleCheckOut(currentAttendanceRecord, checkAttendanceStatus);
  };

  return (
    <>
      <DetailModals
        selectedNoticeId={selectedNoticeId}
        selectedTaskId={selectedTaskId}
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
            <NewsReminderSection
              notices={notices}
              loading={noticesLoading}
              onNoticeClick={handleNoticeClick}
              onRefresh={() => fetchNotices()}
            />
          </SectionContainer>

          {/* Attendance */}
          <SectionContainer variants={sectionVariants}>
            <AttendanceSection
              loading={statusLoading}
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
