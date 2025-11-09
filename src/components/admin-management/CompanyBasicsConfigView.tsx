"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { staggerContainer } from "@/components/ui/animations";

// Import the section components directly
import DivisionsSection from "@/components/admin/divisions/DivisionsSection";
import DepartmentsSection from "@/components/admin/departments/DepartmentsSection";
import GradesSection from "@/components/admin/grades/GradesSection";
import PositionsSection from "@/components/admin/positions/PositionsSection";
import { getCompanyInfo } from "@/lib/utils/auth";

export default function CompanyBasicsConfigView() {
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

  const [hasDivision, setHasDivision] = useState<boolean>(false);

  const initHasDivision = async () => {
    const company = await getCompanyInfo();
    setHasDivision(company.has_division || false);
  };

  useEffect(() => {
    initHasDivision();
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8 w-full"
    >
      {/* Notification */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-3 sm:p-4 rounded-lg shadow-lg flex items-center gap-2 max-w-[90vw] sm:max-w-md ${notification.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
          >
            {notification.isError ? <X className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> : <Info className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
            <span className="text-sm sm:text-base line-clamp-2">{notification.message}</span>
            <button
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className="ml-auto flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-2 sm:px-0">
        {/* Divisions Section */}
        {hasDivision && (
          <div className="mb-8">
            <DivisionsSection
              showNotification={showNotification}
            />
          </div>
        )}


        {/* Departments Section */}
        <div className="mb-8">
          <DepartmentsSection
            showNotification={showNotification}
          />
        </div>

        {/* Grades Section */}
        <div className="mb-8">
          <GradesSection
            showNotification={showNotification}
          />
        </div>

        {/* Positions Section */}
        <div className="mb-8">
          <PositionsSection
            showNotification={showNotification}
          />
        </div>
      </div>
    </motion.div>
  );
}
