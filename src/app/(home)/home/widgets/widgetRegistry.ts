import { Calendar, Bell, CheckSquare, FolderKanban, AlertCircle } from 'lucide-react';
import { WidgetDefinition } from '@/lib/types/widgets';
import AttendanceWidget from './AttendanceWidget';
import NoticesWidget from './NoticesWidget';
import TasksWidget from './TasksWidget';
import ProjectsWidget from './ProjectsWidget';
import StakeholderIssuesWidget from './StakeholderIssuesWidget';

/**
 * Widget Registry
 * Maps widget types to their definitions and components
 */
export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  attendance: {
    type: 'attendance',
    name: 'Attendance',
    description: 'Track your daily attendance with check-in and check-out',
    icon: Calendar,
    defaultSize: 'large',
    minSize: 'medium',
    maxSize: 'full',
    requiresRole: ['employee', 'manager', 'admin'],
    component: AttendanceWidget as any,
  },
  notices: {
    type: 'notices',
    name: 'News & Reminders',
    description: 'View important company notices and announcements',
    icon: Bell,
    defaultSize: 'medium',
    minSize: 'medium',
    maxSize: 'large',
    requiresRole: ['employee', 'manager', 'admin'],
    component: NoticesWidget as any,
  },
  tasks: {
    type: 'tasks',
    name: 'Tasks',
    description: 'View and manage your assigned tasks',
    icon: CheckSquare,
    defaultSize: 'medium',
    minSize: 'medium',
    maxSize: 'large',
    requiresRole: ['employee', 'manager', 'admin'],
    component: TasksWidget as any,
  },
  projects: {
    type: 'projects',
    name: 'Projects',
    description: 'View your ongoing projects and milestones',
    icon: FolderKanban,
    defaultSize: 'medium',
    minSize: 'medium',
    maxSize: 'large',
    requiresRole: ['employee', 'manager', 'admin'],
    component: ProjectsWidget,
  },
  'stakeholder-issues': {
    type: 'stakeholder-issues',
    name: 'Stakeholder Issues',
    description: 'View and manage stakeholder issues assigned to you',
    icon: AlertCircle,
    defaultSize: 'medium',
    minSize: 'medium',
    maxSize: 'large',
    requiresRole: ['employee', 'manager', 'admin'], // All can view, but only manager+ can create
    component: StakeholderIssuesWidget,
  },
};

/**
 * Get widget definition by type
 */
export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY[type];
}

/**
 * Get all available widget definitions
 */
export function getAllWidgetDefinitions(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY);
}

/**
 * Check if user has permission to use a widget
 */
export function canUseWidget(widget: WidgetDefinition, userRoles: string[]): boolean {
  if (!widget.requiresRole || widget.requiresRole.length === 0) {
    return true;
  }
  return widget.requiresRole.some(role => userRoles.includes(role));
}
