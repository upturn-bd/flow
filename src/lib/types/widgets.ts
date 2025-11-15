/**
 * Widget System Type Definitions
 */

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

// Widget types available in the system
export type WidgetType = 
  | 'attendance'
  | 'notices'
  | 'tasks'
  | 'projects'
  | 'stakeholder-issues';

// Widget size options for grid layout
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

// Widget position in grid (row, column)
export interface WidgetPosition {
  row: number;
  col: number;
}

// Widget configuration for individual widget instance
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  enabled: boolean;
  position: WidgetPosition;
  size: WidgetSize;
  order: number; // Display order
  settings?: Record<string, unknown>; // Widget-specific settings
}

// Home page layout configuration
export interface HomeLayoutConfig {
  id?: number;
  employee_id: string;
  company_id: number;
  widgets: WidgetConfig[];
  layout_version: string; // For future migrations
  created_at?: string;
  updated_at?: string;
}

// Widget definition (metadata about widget type)
export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  requiresRole?: ('employee' | 'manager' | 'admin')[]; // Role-based access
  component: React.ComponentType<WidgetProps>;
}

// Props passed to all widget components
export interface WidgetProps {
  config: WidgetConfig;
  isEditMode?: boolean;
  onToggle?: () => void;
  onSizeChange?: (size: WidgetSize) => void;
  onUpdate?: (config: Partial<WidgetConfig>) => void;
  onRemove?: () => void;
}

// Default widget configuration for new users
export const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
  {
    id: 'notices-1',
    type: 'notices',
    enabled: true,
    position: { row: 0, col: 0 },
    size: 'medium',
    order: 0,
  },
  {
    id: 'attendance-1',
    type: 'attendance',
    enabled: true,
    position: { row: 0, col: 1 },
    size: 'large',
    order: 1,
  },
  {
    id: 'tasks-1',
    type: 'tasks',
    enabled: true,
    position: { row: 1, col: 0 },
    size: 'medium',
    order: 2,
  },
  {
    id: 'projects-1',
    type: 'projects',
    enabled: true,
    position: { row: 1, col: 1 },
    size: 'medium',
    order: 3,
  },
  {
    id: 'stakeholder-issues-1',
    type: 'stakeholder-issues',
    enabled: true,
    position: { row: 2, col: 0 },
    size: 'medium',
    order: 4,
  },
];

// Grid layout constants
export const GRID_CONFIG = {
  columns: 2, // 2-column responsive grid
  gap: 6, // Tailwind gap-6
  breakpoints: {
    sm: 1, // 1 column on mobile
    md: 2, // 2 columns on tablet+
    lg: 2, // 2 columns on desktop
    xl: 3, // 3 columns on wide screens
  },
} as const;
