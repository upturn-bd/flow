"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";
import { useState } from "react";
import { fadeInUp, staggerContainer } from "@/components/ui/animations";

// Import the section components directly
import DivisionsSection from "@/components/admin-management/divisions/DivisionsSection";
import DepartmentsSection from "@/components/admin-management/departments/DepartmentsSection";
import GradesSection from "@/components/admin-management/grades/GradesSection";
import PositionsSection from "@/components/admin-management/positions/PositionsSection";

// Add prop type
type CompanyBasicsConfigViewProps = {
  employees: { id: string; name: string }[];
};

export default function CompanyBasicsConfigView({ employees }: CompanyBasicsConfigViewProps) {
  // Notification state
  const [notification, setNotification] = useState<{ message: string; isError: boolean; visible: boolean }>({
    message: '',
    isError: false,
    visible: false
  });

  const showNotification = (message: string, isError = false) => {
    setNotification({ message, isError, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Notification */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
              notification.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {notification.isError ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divisions Section */}
      <DivisionsSection 
        employees={employees} 
        showNotification={showNotification} 
      />

      {/* Departments Section */}
      <DepartmentsSection 
        employees={employees} 
        showNotification={showNotification} 
      />

      {/* Grades Section */}
      <GradesSection 
        showNotification={showNotification} 
      />

      {/* Positions Section */}
      <PositionsSection 
        showNotification={showNotification} 
      />
    </motion.div>
  );
}
