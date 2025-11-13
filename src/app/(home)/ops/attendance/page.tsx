"use client";

import AttendanceAbsentPage from "@/components/ops/attendance/AbsentPage";
import AttendanceLatePage from "@/components/ops/attendance/LatePage";
import AttendancePresentPage from "@/components/ops/attendance/PresentPage";
import AttendanceRecordsPage from "@/components/ops/attendance/RecordsPage";
import AttendanceRequestsPage from "@/components/ops/attendance/RequestsPage";
import AttendanceSection from "@/app/(home)/home/components/AttendanceSection";

import ServicePageTemplate from "@/components/ui/ServicePageTemplate";
import { TabItem } from "@/components/ui/TabView";
import {
  Calendar,
  UserCheck,
  UserX,
  Clock,
  ClipboardCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { PERMISSION_MODULES } from "@/lib/constants";

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tab || "today");

  // Example placeholder states/handlers for AttendanceSection props
  const [attendanceRecord, setAttendanceRecord] = useState({
    tag: "",
    site_id: undefined as number | undefined,
  });
  const [sites, setSites] = useState<any[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState({
    checkIn: false,
    checkOut: false,
  });

  const handleRecordChange = (record: any) => {
    setAttendanceRecord(record);
  };

  const handleCheckIn = async () => {
    console.log("Check-in triggered");
  };

  const handleCheckOut = async () => {
    console.log("Check-out triggered");
  };

  // 🟦 Define all tabs including the new "Today" one
  const tabs: TabItem[] = [
    {
      key: "today",
      label: "Today",
      icon: <Clock className="h-5 w-5" />,
      color: "text-blue-600",
      content: (
        <AttendanceSection
          loading={false}
          attendanceLoading={false}
          attendanceStatus={attendanceStatus}
          attendanceRecord={attendanceRecord}
          sites={sites}
          sitesLoading={false}
          onRecordChange={handleRecordChange}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />
      ),
      link: "/ops/attendance?tab=today",
    },
    {
      key: "records",
      label: "Records",
      icon: <Calendar className="h-5 w-5" />,
      color: "text-gray-600",
      content: <AttendanceRecordsPage />,
      link: "/ops/attendance?tab=records",
    },
    {
      key: "request",
      label: "Request",
      icon: <ClipboardCheck className="h-5 w-5" />,
      color: "text-blue-600",
      content: <AttendanceRequestsPage />,
      link: "/ops/attendance?tab=request",
    },
  ];

  return (
    <ServicePageTemplate
      title="Attendance"
      description="View and manage your attendance records, check your history, and submit attendance requests."
      icon={<Calendar className="h-6 w-6" />}
      primaryColor="text-blue-600"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isLinked={true}
      module={PERMISSION_MODULES.ATTENDANCE}
      showPermissionBanner={true}
    />
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600 animate-pulse" />
            <p className="text-sm text-gray-600">Loading attendance...</p>
          </div>
        </div>
      }
    >
      <AttendancePageContent />
    </Suspense>
  );
}
