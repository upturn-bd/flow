"use client";

import { createSystemNotification } from "@/hooks/useNotifications";

export interface NotificationOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const showNotification = ({ message, type, duration = 3000 }: NotificationOptions) => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up ${
    type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
    type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
    type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
    'bg-blue-100 text-blue-800 border border-blue-200'
  }`;
  notification.innerHTML = message;
  document.body.appendChild(notification);
  
  // Auto remove after duration
  setTimeout(() => {
    notification.classList.add('animate-fade-out');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, duration);
};

// Utility functions for creating common notification types

export const NotificationTemplates = {
  // Leave request notifications
  leaveRequest: {
    submitted: (employeeName: string, leaveType: string, startDate: string, endDate: string) => ({
      title: "Leave Request Submitted",
      message: `${employeeName} has submitted a ${leaveType} request from ${startDate} to ${endDate}`,
      context: "leave_request",
      priority: "normal" as const,
    }),
    approved: (leaveType: string, startDate: string, endDate: string) => ({
      title: "Leave Request Approved",
      message: `Your ${leaveType} request from ${startDate} to ${endDate} has been approved`,
      context: "leave_request",
      priority: "high" as const,
    }),
    rejected: (leaveType: string, reason: string) => ({
      title: "Leave Request Rejected",
      message: `Your ${leaveType} request has been rejected. Reason: ${reason}`,
      context: "leave_request",
      priority: "high" as const,
    }),
  },

  // Project notifications
  project: {
    assigned: (projectName: string, role: string) => ({
      title: "Project Assignment",
      message: `You have been assigned as ${role} to project "${projectName}"`,
      context: "project_update",
      priority: "normal" as const,
    }),
    milestone: (projectName: string, milestoneName: string) => ({
      title: "Milestone Completed",
      message: `Milestone "${milestoneName}" in project "${projectName}" has been completed`,
      context: "project_update",
      priority: "normal" as const,
    }),
    deadline: (projectName: string, daysLeft: number) => ({
      title: "Project Deadline Approaching",
      message: `Project "${projectName}" deadline is in ${daysLeft} days`,
      context: "project_update",
      priority: daysLeft <= 3 ? "urgent" as const : "high" as const,
    }),
  },

  // Employee notifications
  employee: {
    welcome: (employeeName: string) => ({
      title: "Welcome to the Team!",
      message: `Welcome ${employeeName}! Your account has been approved and you can now access all HRIS features.`,
      context: "employee_update",
      priority: "normal" as const,
    }),
    profileUpdate: (field: string) => ({
      title: "Profile Updated",
      message: `Your ${field} has been successfully updated`,
      context: "employee_update",
      priority: "low" as const,
    }),
    documentRequired: (documentType: string) => ({
      title: "Document Required",
      message: `Please upload your ${documentType} to complete your profile`,
      context: "employee_update",
      priority: "high" as const,
    }),
  },

  // Attendance notifications
  attendance: {
    lateCheckIn: (siteName: string, time: string) => ({
      title: "Late Check-in Recorded",
      message: `You checked in late at ${siteName} at ${time}`,
      context: "attendance",
      priority: "normal" as const,
    }),
    missedCheckOut: (siteName: string) => ({
      title: "Missed Check-out",
      message: `You forgot to check out from ${siteName}. Please contact your supervisor.`,
      context: "attendance",
      priority: "high" as const,
    }),
  },

  // System notifications
  system: {
    maintenance: (startTime: string, duration: string) => ({
      title: "System Maintenance",
      message: `System maintenance scheduled at ${startTime} for ${duration}. Some features may be unavailable.`,
      context: "system_alert",
      priority: "high" as const,
    }),
    update: (version: string, features: string) => ({
      title: "System Update",
      message: `System updated to version ${version}. New features: ${features}`,
      context: "system_alert",
      priority: "normal" as const,
    }),
  },
};

// Helper functions to create notifications
export const createLeaveRequestNotification = async (
  recipientId: string,
  type: 'submitted' | 'approved' | 'rejected',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'submitted':
      template = NotificationTemplates.leaveRequest.submitted(
        data.employeeName,
        data.leaveType,
        data.startDate,
        data.endDate
      );
      break;
    case 'approved':
      template = NotificationTemplates.leaveRequest.approved(
        data.leaveType,
        data.startDate,
        data.endDate
      );
      break;
    case 'rejected':
      template = NotificationTemplates.leaveRequest.rejected(
        data.leaveType,
        data.reason
      );
      break;
    default:
      throw new Error('Invalid leave request notification type');
  }

  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};

export const createProjectNotification = async (
  recipientId: string,
  type: 'assigned' | 'milestone' | 'deadline',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'assigned':
      template = NotificationTemplates.project.assigned(data.projectName, data.role);
      break;
    case 'milestone':
      template = NotificationTemplates.project.milestone(data.projectName, data.milestoneName);
      break;
    case 'deadline':
      template = NotificationTemplates.project.deadline(data.projectName, data.daysLeft);
      break;
    default:
      throw new Error('Invalid project notification type');
  }

  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};

export const createEmployeeNotification = async (
  recipientId: string,
  type: 'welcome' | 'profileUpdate' | 'documentRequired',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'welcome':
      template = NotificationTemplates.employee.welcome(data.employeeName);
      break;
    case 'profileUpdate':
      template = NotificationTemplates.employee.profileUpdate(data.field);
      break;
    case 'documentRequired':
      template = NotificationTemplates.employee.documentRequired(data.documentType);
      break;
    default:
      throw new Error('Invalid employee notification type');
  }

  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};

export const createAttendanceNotification = async (
  recipientId: string,
  type: 'lateCheckIn' | 'missedCheckOut',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'lateCheckIn':
      template = NotificationTemplates.attendance.lateCheckIn(data.siteName, data.time);
      break;
    case 'missedCheckOut':
      template = NotificationTemplates.attendance.missedCheckOut(data.siteName);
      break;
    default:
      throw new Error('Invalid attendance notification type');
  }

  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};

export const createSystemNotificationHelper = async (
  recipientId: string,
  type: 'maintenance' | 'update',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'maintenance':
      template = NotificationTemplates.system.maintenance(data.startTime, data.duration);
      break;
    case 'update':
      template = NotificationTemplates.system.update(data.version, data.features);
      break;
    default:
      throw new Error('Invalid system notification type');
  }

  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};
