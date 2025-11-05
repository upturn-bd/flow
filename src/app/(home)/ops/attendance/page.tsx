"use client";

import AttendanceAbsentPage from "@/components/ops/attendance/AbsentPage";
import AttendanceLatePage from "@/components/ops/attendance/LatePage";
import AttendancePresentPage from "@/components/ops/attendance/PresentPage";
import AttendanceRecordsPage from "@/components/ops/attendance/RecordsPage";
import AttendanceRequestsPage from "@/components/ops/attendance/RequestsPage";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";
import { TabItem } from "@/components/ui/TabView";
import { 
  Calendar, 
  UserCheck, 
  UserX, 
  Clock, 
  ClipboardCheck 
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { useState, Suspense } from "react";

const tabs: TabItem[] = [
  {
    key: "records",
    label: "Records",
    icon: <Calendar className="h-5 w-5" />,
    color: "text-gray-600",
    content: <AttendanceRecordsPage />,
    link: "/ops/attendance?tab=records",
  },
  { 
    key: "present", 
    label: "Present",
    icon: <UserCheck className="h-5 w-5" />,
    color: "text-green-600",
    content: <AttendancePresentPage />,
    link: "/ops/attendance?tab=present",
  },
  { 
    key: "absent", 
    label: "Absent",
    icon: <UserX className="h-5 w-5" />,
    color: "text-red-600",
    content: <AttendanceAbsentPage />,
    link: "/ops/attendance?tab=absent",
  },
  { 
    key: "late_wrong", 
    label: "Late / Wrong Location",
    icon: <Clock className="h-5 w-5" />,
    color: "text-amber-600",
    content: <AttendanceLatePage />,
    link: "/ops/attendance?tab=late_wrong",
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

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(tab || "records");

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
    />
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-600 animate-pulse" />
          <p className="text-sm text-gray-600">Loading attendance...</p>
        </div>
      </div>
    }>
      <AttendancePageContent />
    </Suspense>
  );
}
