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
import ServicesWidget from "@/app/(home)/home/widgets/ServicesWidget";
import { Settings, GripVertical, Eye, EyeOff, ArrowDownRight } from "lucide-react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { WidgetConfig, WidgetSize } from "@/lib/types/widgets";

// Grid configuration
const DESKTOP_COLS = 12;
const MOBILE_COLS = 1;
const ROW_HEIGHT = 80;

export default function HomePage() {
  const { employeeInfo } = useAuth();
  const { layout: homeLayout, loading: layoutLoading, saveLayout, updateAllWidgets } = useHomeLayout();
  const [isEditMode, setIsEditMode] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width for responsive grid
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0) {
          setContainerWidth(width);
          setIsMobile(width < 768); // Mobile breakpoint at 768px
        }
      }
    };

    // Use ResizeObserver for more reliable container size tracking
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    // Attach observer when ref becomes available
    const currentContainer = containerRef.current;
    if (currentContainer) {
      resizeObserver.observe(currentContainer);
      updateWidth();
    }

    // Also update on window resize
    window.addEventListener('resize', updateWidth);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [layoutLoading]); // Re-run when layoutLoading changes

  // Get current grid columns based on screen size
  const gridCols = isMobile ? MOBILE_COLS : DESKTOP_COLS;

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
    
    // Filter out hidden widgets when not in edit mode
    const visibleWidgets = isEditMode 
      ? homeLayout.widgets 
      : homeLayout.widgets.filter(w => w.enabled);
    
    return visibleWidgets.map((widget, index) => {
      // Use stored dimensions if available, otherwise use size-based defaults
      const gridSize = widget.position?.width && widget.position?.height
        ? { w: widget.position.width, h: widget.position.height }
        : getWidgetGridSize(widget.size);
      
      // On mobile, force single column layout
      const responsiveWidth = isMobile ? 1 : gridSize.w;
      const responsiveX = isMobile ? 0 : (widget.position?.col ?? 0);
      
      // If widget has stored position, use it
      if (widget.position?.col !== undefined && widget.position?.row !== undefined) {
        return {
          i: widget.id,
          x: responsiveX,
          y: isMobile ? index * gridSize.h : widget.position.row,
          w: responsiveWidth,
          h: gridSize.h,
          minW: isMobile ? 1 : 4,
          minH: 5,
        };
      }
      
      // Default positioning: create a grid flow layout
      let x = 0;
      let y = 0;
      
      // Calculate position based on previous widgets
      if (index > 0) {
        const prevWidgets = visibleWidgets.slice(0, index);
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
          for (let testX = 0; testX <= DESKTOP_COLS - gridSize.w && !foundPosition; testX += 1) {
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
        x: isMobile ? 0 : x,
        y: isMobile ? index * gridSize.h : y,
        w: responsiveWidth,
        h: gridSize.h,
        minW: isMobile ? 1 : 4,
        minH: 5,
      };
    });
  }, [homeLayout?.widgets, isMobile, isEditMode]);

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

  // Toggle widget visibility
  const handleToggleWidget = (widgetId: string) => {
    if (!homeLayout?.widgets) return;
    
    const updatedWidgets = homeLayout.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
    );
    
    if (updateAllWidgets) {
      updateAllWidgets(updatedWidgets);
    }
  };

  // Render widget content based on type  
  const renderWidget = (widgetConfig: WidgetConfig) => {
    if (!widgetConfig.enabled && !isEditMode) return null;

    const commonProps = {
      config: widgetConfig,
      isEditMode,
      onToggle: () => handleToggleWidget(widgetConfig.id),
    };

    switch (widgetConfig.type) {
      case 'attendance':
        return <AttendanceWidget {...commonProps} />;
      case 'notices':
        return <NoticesWidget {...commonProps} />;
      case 'tasks':
        return <TasksWidget {...commonProps} onTaskClick={() => {}} />;
      case 'projects':
        return <ProjectsWidget {...commonProps} />;
      case 'stakeholder-issues':
        return <StakeholderIssuesWidget {...commonProps} />;
      case 'services':
        return <ServicesWidget {...commonProps} />;
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
      className="min-h-screen bg-gray-50 px-2 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8"
    >
      <div className="w-full max-w-full">
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
            {containerWidth > 0 && (
              <GridLayout
                className="layout"
                layout={gridLayout}
                cols={gridCols}
              rowHeight={isMobile ? 60 : ROW_HEIGHT}
              width={containerWidth}
              margin={isMobile ? [8, 8] : [16, 16]}
              containerPadding={[0, 0]}
              isDraggable={isEditMode && !isMobile}
              isResizable={isEditMode && !isMobile}
              onLayoutChange={handleLayoutChange}
              compactType={null}
              preventCollision={true}
            >
              {(isEditMode ? homeLayout?.widgets : homeLayout?.widgets.filter(w => w.enabled))?.map((widget) => (
                <div key={widget.id} className="h-full w-full relative">
                  <div className={isEditMode ? 'pointer-events-none' : ''}>
                    {renderWidget(widget)}
                  </div>
                  {/* Edit mode overlay with controls */}
                  {isEditMode && (
                    <div className={`absolute inset-0 border-2 rounded-lg pointer-events-none z-10 transition-all ${
                      widget.enabled 
                        ? 'bg-blue-500/10 border-blue-400' 
                        : 'bg-gray-500/20 border-gray-400'
                    }`}>
                      {/* Control bar at top */}
                      <div className={`absolute top-0 left-0 right-0 backdrop-blur-sm px-4 py-3 flex items-center justify-between rounded-t-md pointer-events-auto ${
                        widget.enabled 
                          ? 'bg-blue-500/90' 
                          : 'bg-gray-500/90'
                      }`}>
                        <div className="flex items-center gap-3">
                          <GripVertical size={20} className="text-white cursor-grab active:cursor-grabbing" />
                          <span className="text-white text-base font-semibold">
                            {widget.type.charAt(0).toUpperCase() + widget.type.slice(1).replace('-', ' ')}
                          </span>
                          {!widget.enabled && (
                            <span className="text-white/80 text-sm">(Hidden)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWidget(widget.id);
                            }}
                            className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                            title={widget.enabled ? 'Hide widget' : 'Show widget'}
                          >
                            {widget.enabled ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                      {/* Resize handle indicator at bottom-right */}
                      {widget.enabled && (
                        <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none flex items-center justify-center bg-blue-500 rounded-tl">
                          <ArrowDownRight size={20} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </GridLayout>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
