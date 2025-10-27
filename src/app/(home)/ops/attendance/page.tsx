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
import { useState } from "react";

const tabs: TabItem[] = [
  {
    key: "records",
    label: "Records",
    icon: <Calendar className="h-5 w-5" />,
    color: "text-gray-600",
    content: <AttendanceRecordsPage />
  },
  { 
    key: "present", 
    label: "Present",
    icon: <UserCheck className="h-5 w-5" />,
    color: "text-green-600",
    content: <AttendancePresentPage />
  },
  { 
    key: "absent", 
    label: "Absent",
    icon: <UserX className="h-5 w-5" />,
    color: "text-red-600",
    content: <AttendanceAbsentPage />
  },
  { 
    key: "late_wrong", 
    label: "Late / Wrong Location",
    icon: <Clock className="h-5 w-5" />,
    color: "text-amber-600",
    content: <AttendanceLatePage />
  },
  { 
    key: "request", 
    label: "Request",
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: "text-blue-600",
    content: <AttendanceRequestsPage />
  },
];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("records");

  return (
    <ServicePageTemplate
      title="Attendance"
      description="View and manage your attendance records, check your history, and submit attendance requests."
      icon={<Calendar className="h-6 w-6" />}
      primaryColor="text-blue-600"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      actionButtonLabel="View Present"
      actionButtonIcon={<UserCheck className="h-4 w-4" />}
      actionButtonOnClick={() => setActiveTab("present")}
    />
  );
}
