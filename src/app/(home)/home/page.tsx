"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useState, useMemo, useRef, useEffect } from "react";
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
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { WidgetConfig } from "@/lib/types/widgets";

// Grid configuration
const GRID_COLS = 12;
const ROW_HEIGHT = 80;

export default function HomePage() {
  const { employeeInfo } = useAuth();
  const { layout: homeLayout, loading: layoutLoading, saveLayout, updateAllWidgets } = useHomeLayout();
  const [isEditMode, setIsEditMode] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width for responsive grid
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
        setIsMobile(width < 768); // Mobile breakpoint at 768px
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Convert widget sizes to grid layout format
  const getWidgetGridSize = (size: string) => {
    switch (size) {
      case 'small': return { w: 4, h: 5 };
      case 'medium': return { w: 6, h: 5 };
      case 'large': return { w: 12, h: 5 };
      case 'full': return { w: 12, h: 6 };
      default: return { w: 6, h: 5 };
    }
  };

  // Create grid layout from widgets
  const gridLayout = useMemo(() => {
    if (!homeLayout?.widgets) return [];
    
    return homeLayout.widgets.map((widget, index) => {
      // Use stored dimensions if available, otherwise use size-based defaults
      const gridSize = widget.position?.width && widget.position?.height
        ? { w: widget.position.width, h: widget.position.height }
        : getWidgetGridSize(widget.size);
      
      // If widget has stored position, use it
      if (widget.position?.col !== undefined && widget.position?.row !== undefined) {
        return {
          i: widget.id,
          x: widget.position.col,
          y: widget.position.row,
          w: gridSize.w,
          h: gridSize.h,
          minW: 4,
          minH: 5,
        };
      }
      
      // Default positioning: create a grid flow layout
      let x = 0;
      let y = 0;
      
      // Calculate position based on previous widgets
      if (index > 0) {
        const prevWidgets = homeLayout.widgets.slice(0, index);
        const occupiedSpaces: { x: number; y: number; w: number; h: number }[] = [];
        
        prevWidgets.forEach((prevWidget, prevIndex) => {
          const prevSize = prevWidget.position?.width && prevWidget.position?.height
            ? { w: prevWidget.position.width, h: prevWidget.position.height }
            : getWidgetGridSize(prevWidget.size);
          const prevX = prevWidget.position?.col ?? 0;
          const prevY = prevWidget.position?.row ?? 0;
          occupiedSpaces.push({ x: prevX, y: prevY, w: prevSize.w, h: prevSize.h });
        });
        
        // Find first available position
        let foundPosition = false;
        for (let testY = 0; testY < 100 && !foundPosition; testY += 1) {
          for (let testX = 0; testX <= GRID_COLS - gridSize.w && !foundPosition; testX += 1) {
            const hasCollision = occupiedSpaces.some(space => {
              return !(
                testX + gridSize.w <= space.x ||
                testX >= space.x + space.w ||
                testY + gridSize.h <= space.y ||
                testY >= space.y + space.h
              );
            });
            
            if (!hasCollision) {
              x = testX;
              y = testY;
              foundPosition = true;
            }
          }
        }
      }
      
      return {
        i: widget.id,
        x,
        y,
        w: gridSize.w,
        h: gridSize.h,
        minW: 4,
        minH: 5,
      };
    });
  }, [homeLayout?.widgets]);

  const handleLayoutChange = (newLayout: any[]) => {
    if (!homeLayout?.widgets || !isEditMode) return;

    const updatedWidgets = homeLayout.widgets.map((widget) => {
      const layoutItem = newLayout.find((item) => item.i === widget.id);
      if (!layoutItem) return widget;

      // Determine size based on width with better thresholds
      let newSize = widget.size;
      if (layoutItem.w >= 10) {
        // 10-12 columns = large (allows for small resize variations)
        newSize = 'large';
      } else if (layoutItem.w >= 5) {
        // 5-9 columns = medium
        newSize = 'medium';
      } else {
        // 4 or less = small
        newSize = 'small';
      }

      return {
        ...widget,
        position: { 
          row: layoutItem.y, 
          col: layoutItem.x,
          width: layoutItem.w,
          height: layoutItem.h
        },
        size: newSize,
      };
    });

    if (updateAllWidgets) {
      updateAllWidgets(updatedWidgets);
    }
  };

  // Render widget content based on type  
  const renderWidget = (widgetConfig: WidgetConfig) => {
    if (!widgetConfig.enabled && !isEditMode) return null;

    switch (widgetConfig.type) {
      case 'attendance':
        return <AttendanceWidget config={widgetConfig} isEditMode={false} />;
      case 'notices':
        return <NoticesWidget config={widgetConfig} isEditMode={false} />;
      case 'tasks':
        return <TasksWidget config={widgetConfig} isEditMode={false} onTaskClick={() => {}} />;
      case 'projects':
        return <ProjectsWidget config={widgetConfig} isEditMode={false} />;
      case 'stakeholder-issues':
        return <StakeholderIssuesWidget config={widgetConfig} isEditMode={false} />;
      default:
        return null;
    }
  };

  const handleSaveLayout = async () => {
    if (homeLayout?.widgets && saveLayout) {
      await saveLayout(homeLayout.widgets);
      setIsEditMode(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-gray-50 px-2 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8"
    >
      <div className="w-full">
        {/* Header with edit button */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLayout}
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Customize</span>
              </button>
            )}
          </div>
        </div>

        {layoutLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        ) : (
          <div ref={containerRef} className="w-full">
            <GridLayout
              className="layout"
              layout={gridLayout}
              cols={GRID_COLS}
              rowHeight={isMobile ? 60 : ROW_HEIGHT}
              width={containerWidth}
              margin={isMobile ? [8, 8] : [16, 16]}
              containerPadding={[0, 0]}
              isDraggable={isEditMode}
              isResizable={isEditMode}
              onLayoutChange={handleLayoutChange}
              compactType={null}
              preventCollision={true}
            >
              {homeLayout?.widgets.map((widget) => (
                <div key={widget.id} className="h-full w-full">
                  {renderWidget(widget)}
                </div>
              ))}
            </GridLayout>
          </div>
        )}
      </div>
    </motion.div>
  );
}
