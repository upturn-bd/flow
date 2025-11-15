"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useState } from "react";
import { motion } from "framer-motion";
import { pageVariants } from "@/app/(home)/home/components/animations";
import { useHomeLayout } from "@/hooks/useHomeLayout";
import { getWidgetDefinition } from "@/app/(home)/home/widgets/widgetRegistry";
import AttendanceWidget from "@/app/(home)/home/widgets/AttendanceWidget";
import NoticesWidget from "@/app/(home)/home/widgets/NoticesWidget";
import TasksWidget from "@/app/(home)/home/widgets/TasksWidget";
import ProjectsWidget from "@/app/(home)/home/widgets/ProjectsWidget";
import StakeholderIssuesWidget from "@/app/(home)/home/widgets/StakeholderIssuesWidget";
import { Settings } from "lucide-react";

export default function HomePage() {
  const { employeeInfo } = useAuth();
  const { layout, loading: layoutLoading, saveLayout, updateWidget } = useHomeLayout();
  const [isEditMode, setIsEditMode] = useState(false);

  // Render widget based on type
  const renderWidget = (widgetConfig: any) => {
    if (!widgetConfig.enabled && !isEditMode) return null;

    const widgetDef = getWidgetDefinition(widgetConfig.type);
    if (!widgetDef) return null;

    const key = widgetConfig.id;

    const handleToggleWidget = () => {
      if (updateWidget) {
        updateWidget(widgetConfig.id, { enabled: !widgetConfig.enabled });
      }
    };

    const handleSizeChange = (newSize: any) => {
      if (updateWidget) {
        updateWidget(widgetConfig.id, { size: newSize });
      }
    };

    const widgetProps = {
      config: widgetConfig,
      isEditMode,
      onToggle: handleToggleWidget,
      onSizeChange: handleSizeChange,
    };

    switch (widgetConfig.type) {
      case 'attendance':
        return <AttendanceWidget key={key} {...widgetProps} />;
      case 'notices':
        return <NoticesWidget key={key} {...widgetProps} />;
      case 'tasks':
        return <TasksWidget key={key} {...widgetProps} />;
      case 'projects':
        return <ProjectsWidget key={key} {...widgetProps} />;
      case 'stakeholder-issues':
        return <StakeholderIssuesWidget key={key} {...widgetProps} />;
      default:
        return null;
    }
  };

  const handleSaveLayout = async () => {
    if (layout?.widgets && saveLayout) {
      await saveLayout(layout.widgets);
      setIsEditMode(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with edit button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLayout}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings size={18} />
                Customize
              </button>
            )}
          </div>
        </div>

        {layoutLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {layout?.widgets
              .sort((a, b) => a.order - b.order)
              .map(widgetConfig => renderWidget(widgetConfig))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
