"use client";

import { Info, X, Loader } from "@/lib/icons";
import { useState } from "react";

// Import the section components directly
import DivisionsSection from "@/components/admin/divisions/DivisionsSection";
import DepartmentsSection from "@/components/admin/departments/DepartmentsSection";
import GradesSection from "@/components/admin/grades/GradesSection";
import PositionsSection from "@/components/admin/positions/PositionsSection";
import { useAdminData } from "@/contexts/AdminDataContext";

export default function CompanyBasicsConfigView() {
  // Get company info from context
  const { companyInfo, loading } = useAdminData();
  
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

  const hasDivision = companyInfo?.has_division || false;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading organizational structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      {/* Notification */}
      {notification.visible && (
        <div
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
        </div>
      )}

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
    </div>
  );
}
