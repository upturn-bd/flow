"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/ui/animations";
import { Settings } from "lucide-react";

// Import all the admin management components
import SupervisorLineageView from "@/components/admin/supervisor-lineage/SupervisorLineageView";
import AttendanceManagementView from "@/components/admin/attendance/AttendanceManagementView";
import LeaveManagementView from "@/components/admin/leave/LeaveManagementView";
import InventoryManagementView from "@/components/admin/inventory/InventoryManagementView";
import SettlementView from "@/components/admin/settlement/SettlementView";
import NoticeManagementView from "@/components/admin/notice/NoticeManagementView";
import ComplaintsManagementView from "@/components/admin/complaints/ComplaintsManagementView";

// Simple component to show while loading or when components can't be found
function PlaceholderCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
}

// Safe component wrapper that handles missing components
function SafeComponent({ 
  component: Component, 
  fallbackTitle, 
  fallbackMessage 
}: { 
  component: React.ComponentType<any>; 
  fallbackTitle: string; 
  fallbackMessage: string; 
}) {
  try {
    return <Component />;
  } catch (e) {
    return <PlaceholderCard title={fallbackTitle} message={fallbackMessage} />;
  }
}

export default function SetupStep2() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      <motion.div
        variants={fadeInUp}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Step 2: Administrative Configuration</h2>
        <p className="text-gray-600">Configure administrative settings and employee management rules</p>
      </motion.div>
      
      <Suspense fallback={
        <PlaceholderCard 
          title="Loading Components" 
          message="Loading administrative management components..." 
        />
      }>
        <div className="space-y-6">
          <SafeComponent
            component={SupervisorLineageView}
            fallbackTitle="Supervisor Lineage"
            fallbackMessage="Supervisor lineage component not available"
          />
          
          <SafeComponent
            component={AttendanceManagementView}
            fallbackTitle="Attendance Management"
            fallbackMessage="Attendance management component not available"
          />
          
          <SafeComponent
            component={LeaveManagementView}
            fallbackTitle="Leave Management"
            fallbackMessage="Leave management component not available"
          />
          
          <SafeComponent
            component={InventoryManagementView}
            fallbackTitle="Inventory Management"
            fallbackMessage="Inventory management component not available"
          />
          
          <SafeComponent
            component={SettlementView}
            fallbackTitle="Claim Settlement"
            fallbackMessage="Claim settlement component not available"
          />
          
          <SafeComponent
            component={NoticeManagementView}
            fallbackTitle="News & Notices"
            fallbackMessage="News and notices component not available"
          />
          
          <SafeComponent
            component={ComplaintsManagementView}
            fallbackTitle="Complaints Management"
            fallbackMessage="Complaints management component not available"
          />
        </div>
      </Suspense>
    </motion.div>
  );
}
