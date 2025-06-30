"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/ui/animations";
import { Building, Settings, Users } from "lucide-react";

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

export default function AdministrativeManagement() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6 py-12 px-6 max-w-4xl mx-auto lg:mx-20"
    >
      <motion.div
        variants={fadeInUp}
        className="flex items-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-2 rounded-lg bg-gray-100 text-gray-700 mr-3"
        >
          <Settings size={24} />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Administrative Management</h1>
          <p className="text-gray-600">Configure administrative settings and employee management rules</p>
        </div>
      </motion.div>
      
      <Suspense fallback={
        <PlaceholderCard 
          title="Loading Components" 
          message="Loading administrative management components..." 
        />
      }>
        <div className="space-y-6">
          {/* Dynamic import of components */}
          {/* These will be rendered if available, otherwise we show placeholders */}
          {(() => {
            try {
              // Try to dynamically import components
              const SupervisorLineageView = require("@/components/admin-management/supervisor-lineage/SupervisorLineageView").default;
              return <SupervisorLineageView />;
            } catch (e) {
              return <PlaceholderCard title="Supervisor Lineage" message="Supervisor lineage component not available" />;
            }
          })()}
          
          {(() => {
            try {
              const AttendanceManagementView = require("@/components/admin-management/attendance/AttendanceManagementView").default;
              return <AttendanceManagementView />;
            } catch (e) {
              return <PlaceholderCard title="Attendance Management" message="Attendance management component not available" />;
            }
          })()}
          
          {(() => {
            try {
              const LeaveManagementView = require("@/components/admin-management/leave/LeaveManagementView").default;
              return <LeaveManagementView />;
            } catch (e) {
              return <PlaceholderCard title="Leave Management" message="Leave management component not available" />;
            }
          })()}
          
          {(() => {
            try {
              const InventoryManagementView = require("@/components/admin-management/inventory/InventoryManagementView").default;
              return <InventoryManagementView />;
            } catch (e) {
              return <PlaceholderCard title="Inventory Management" message="Inventory management component not available" />;
            }
          })()}
          
          {(() => {
            try {
              const ClaimSettlementView = require("@/components/admin-management/settlement/SettlementView").default;
              return <ClaimSettlementView />;
            } catch (e) {
              return <PlaceholderCard title="Claim Settlement" message="Claim settlement component not available" />;
            }
          })()}
          
          {(() => {
            try {
              const NoticeView = require("@/components/admin-management/notice/NoticeManagementView").default;
              return <NoticeView />;
            } catch (e) {
              return <PlaceholderCard title="News & Notices" message="News and notices component not available" />;
            }
          })()}
          
          {(() => {
            try {
              const ComplaintsView = require("@/components/admin-management/complaints/ComplaintsManagementView").default;
              return <ComplaintsView />;
            } catch (e) {
              return <PlaceholderCard title="Complaints Management" message="Complaints management component not available" />;
            }
          })()}
        </div>
      </Suspense>
      
      <motion.div
        variants={fadeInUp}
        className="flex justify-between mt-8"
      >
        <motion.a
          href="/admin-management"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all duration-200"
        >
          <span className="font-medium">Back to Company Management</span>
        </motion.a>
      </motion.div>
    </motion.div>
  );
}
