"use client";

import AttendanceAbsentPage from "@/components/operations-and-services/attendance/AbsentPage";
import AttendanceLatePage from "@/components/operations-and-services/attendance/LatePage";
import AttendancePresentPage from "@/components/operations-and-services/attendance/PresentPage";
import AttendanceRequestsPage from "@/components/operations-and-services/attendance/RequestsPage";
import TabView, { TabItem } from "@/components/ui/TabView";
import { motion } from "framer-motion";
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
  const [activeTab, setActiveTab] = useState("present");

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.5, when: "beforeChildren" } 
    },
    exit: { 
      opacity: 0, 
      transition: { duration: 0.3 } 
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageVariants}
      className="max-w-6xl mx-auto p-4 sm:p-6"
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
          <Calendar className="mr-2 h-6 w-6 text-blue-500" />
          Attendance
        </h1>
        <p className="text-gray-600 max-w-3xl">
          View and manage your attendance records, check your history, and submit attendance requests.
        </p>
      </motion.div>

      <TabView 
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contentVariants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          },
          exit: {
            opacity: 0,
            y: -20,
            transition: {
              duration: 0.3
            }
          }
        }}
      />
    </motion.div>
  );
}
