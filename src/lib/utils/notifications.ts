"use client";

import { createSystemNotification } from "@/hooks/useNotifications";
import { getCompanyId } from "@/lib/utils/auth";

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

  // Payroll notifications
  payroll: {
    generated: (employeeName: string, amount: number, date: string) => ({
      title: "Payroll Generated",
      message: `Your payroll (৳${amount.toLocaleString()}) has been generated for ${date}`,
      context: "payroll",
      priority: "normal" as const,
    }),
    published: (employeeName: string, newAmount: number, adjustmentReason: string) => ({
      title: "Payroll Published",
      message: `Your payroll has been published with amount ৳${newAmount.toLocaleString()}. ${adjustmentReason ? `Reason: ${adjustmentReason}` : ''}`,
      context: "payroll",
      priority: "high" as const,
    }),
    paid: (employeeName: string, amount: number, date: string) => ({
      title: "Payroll Processed",
      message: `Your payroll payment (৳${amount.toLocaleString()}) has been processed for ${date}`,
      context: "payroll",
      priority: "normal" as const,
    }),
    supervisorPending: (employeeName: string, amount: number, date: string) => ({
      title: "Payroll Pending Approval",
      message: `Payroll for ${employeeName} (৳${amount.toLocaleString()}) is pending your approval for ${date}`,
      context: "payroll",
      priority: "normal" as const,
    }),
  },

  // Account-related notifications  
  account: {
    transactionCreated: (title: string, amount: number, currency: string) => ({
      title: "New Transaction Created",
      message: `A new transaction "${title}" for ${amount >= 0 ? '+' : ''}${amount.toLocaleString()} ${currency} has been added`,
      context: "account",
      priority: "normal" as const,
    }),
    stakeholderTransaction: (title: string, amount: number, currency: string, stakeholderName: string) => ({
      title: "Stakeholder Transaction Created",
      message: `A new transaction "${title}" for ${amount >= 0 ? '+' : ''}${amount.toLocaleString()} ${currency} has been created for stakeholder "${stakeholderName}"`,
      context: "stakeholder_account",
      priority: "normal" as const,
    }),
    payrollLogged: (employeeName: string, amount: number, date: string) => ({
      title: "Payroll Logged to Accounts",
      message: `Payroll payment for ${employeeName} (৳${Math.abs(amount).toLocaleString()}) has been automatically logged to accounts for ${date}`,
      context: "account",
      priority: "low" as const,
    }),
    largeTransaction: (title: string, amount: number, currency: string) => ({
      title: "Large Transaction Alert",
      message: `A large transaction "${title}" for ${amount >= 0 ? '+' : ''}${amount.toLocaleString()} ${currency} requires attention`,
      context: "account", 
      priority: "high" as const,
    }),
    stakeholderLargeTransaction: (title: string, amount: number, currency: string, stakeholderName: string) => ({
      title: "Large Stakeholder Transaction Alert",
      message: `A large transaction "${title}" for ${amount >= 0 ? '+' : ''}${amount.toLocaleString()} ${currency} requires attention for stakeholder "${stakeholderName}"`,
      context: "stakeholder_account",
      priority: "high" as const,
    }),
    statusChanged: (title: string, oldStatus: string, newStatus: string) => ({
      title: "Transaction Status Updated",
      message: `Transaction "${title}" status changed from ${oldStatus} to ${newStatus}`,
      context: "account",
      priority: "normal" as const,
    }),
  },

  // Stakeholder-related notifications
  stakeholder: {
    created: (stakeholderName: string, processName: string) => ({
      title: "New Stakeholder Added",
      message: `New stakeholder "${stakeholderName}" has been added with process "${processName}"`,
      context: "stakeholder",
      priority: "normal" as const,
    }),
    updated: (stakeholderName: string) => ({
      title: "Stakeholder Updated",
      message: `Stakeholder "${stakeholderName}" information has been updated`,
      context: "stakeholder",
      priority: "normal" as const,
    }),
    statusChanged: (stakeholderName: string, oldStatus: string, newStatus: string) => ({
      title: "Stakeholder Status Changed",
      message: `Stakeholder "${stakeholderName}" status changed from ${oldStatus} to ${newStatus}`,
      context: "stakeholder",
      priority: "high" as const,
    }),
    rejected: (stakeholderName: string, reason: string) => ({
      title: "Stakeholder Rejected",
      message: `Stakeholder "${stakeholderName}" has been rejected. Reason: ${reason}`,
      context: "stakeholder",
      priority: "high" as const,
    }),
    completed: (stakeholderName: string) => ({
      title: "Stakeholder Process Completed",
      message: `All process steps for stakeholder "${stakeholderName}" have been completed`,
      context: "stakeholder",
      priority: "high" as const,
    }),
    stepCompleted: (stakeholderName: string, stepName: string) => ({
      title: "Process Step Completed",
      message: `Step "${stepName}" has been completed for stakeholder "${stakeholderName}"`,
      context: "stakeholder_step",
      priority: "normal" as const,
    }),
    stepUpdated: (stakeholderName: string, stepName: string) => ({
      title: "Process Step Updated",
      message: `Step "${stepName}" has been updated for stakeholder "${stakeholderName}"`,
      context: "stakeholder_step",
      priority: "normal" as const,
    }),
    stepRolledBack: (stakeholderName: string, stepName: string) => ({
      title: "Process Step Rolled Back",
      message: `Step "${stepName}" has been rolled back for stakeholder "${stakeholderName}"`,
      context: "stakeholder_step",
      priority: "high" as const,
    }),
    assignedToTeam: (stakeholderName: string, stepName: string, teamName: string) => ({
      title: "New Stakeholder Assignment",
      message: `Stakeholder "${stakeholderName}" is now at step "${stepName}" assigned to your team "${teamName}"`,
      context: "stakeholder_step",
      priority: "normal" as const,
    }),
  },

  // Stakeholder issue notifications
  stakeholderIssue: {
    created: (stakeholderName: string, issueTitle: string, priority: string) => {
      const notificationPriority = (priority === 'High' || priority === 'Urgent' ? "high" : "normal") as 'high' | 'normal';
      return {
        title: "New Stakeholder Issue",
        message: `New ${priority} priority issue "${issueTitle}" reported for stakeholder "${stakeholderName}"`,
        context: "stakeholder_issue",
        priority: notificationPriority,
      };
    },
    assigned: (stakeholderName: string, issueTitle: string) => ({
      title: "Issue Assigned to You",
      message: `Issue "${issueTitle}" for stakeholder "${stakeholderName}" has been assigned to you`,
      context: "stakeholder_issue",
      priority: "high" as const,
    }),
    statusChanged: (stakeholderName: string, issueTitle: string, newStatus: string) => ({
      title: "Issue Status Updated",
      message: `Issue "${issueTitle}" for stakeholder "${stakeholderName}" is now ${newStatus}`,
      context: "stakeholder_issue",
      priority: "normal" as const,
    }),
    resolved: (stakeholderName: string, issueTitle: string) => ({
      title: "Issue Resolved",
      message: `Issue "${issueTitle}" for stakeholder "${stakeholderName}" has been resolved`,
      context: "stakeholder_issue",
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

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
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

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
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

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
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

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
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

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};

// Payroll notification helper
export const createPayrollNotification = async (
  recipientId: string,
  type: 'generated' | 'published' | 'paid' | 'supervisorPending',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'generated':
      template = NotificationTemplates.payroll.generated(data.employeeName, data.amount, data.date);
      break;
    case 'published':
      template = NotificationTemplates.payroll.published(data.employeeName, data.newAmount, data.adjustmentReason);
      break;
    case 'paid':
      template = NotificationTemplates.payroll.paid(data.employeeName, data.amount, data.date);
      break;
    case 'supervisorPending':
      template = NotificationTemplates.payroll.supervisorPending(data.employeeName, data.amount, data.date);
      break;
    default:
      throw new Error('Invalid payroll notification type');
  }

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};

// Account notification helper
export const createAccountNotification = async (
  recipientId: string,
  type: 'transactionCreated' | 'payrollLogged' | 'largeTransaction' | 'statusChanged' | 'stakeholderTransaction' | 'stakeholderLargeTransaction',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'transactionCreated':
      template = NotificationTemplates.account.transactionCreated(data.title, data.amount, data.currency);
      break;
    case 'stakeholderTransaction':
      template = NotificationTemplates.account.stakeholderTransaction(data.title, data.amount, data.currency, data.stakeholderName);
      break;
    case 'payrollLogged':
      template = NotificationTemplates.account.payrollLogged(data.employeeName, data.amount, data.date);
      break;
    case 'largeTransaction':
      template = NotificationTemplates.account.largeTransaction(data.title, data.amount, data.currency);
      break;
    case 'stakeholderLargeTransaction':
      template = NotificationTemplates.account.stakeholderLargeTransaction(data.title, data.amount, data.currency, data.stakeholderName);
      break;
    case 'statusChanged':
      template = NotificationTemplates.account.statusChanged(data.title, data.oldStatus, data.newStatus);
      break;
    default:
      throw new Error('Invalid account notification type');
  }

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};

// Stakeholder notification helper
export const createStakeholderNotification = async (
  recipientId: string,
  type: 'created' | 'updated' | 'statusChanged' | 'rejected' | 'completed' | 'stepCompleted' | 'stepUpdated' | 'stepRolledBack' | 'assignedToTeam',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'created':
      template = NotificationTemplates.stakeholder.created(data.stakeholderName, data.processName);
      break;
    case 'updated':
      template = NotificationTemplates.stakeholder.updated(data.stakeholderName);
      break;
    case 'statusChanged':
      template = NotificationTemplates.stakeholder.statusChanged(data.stakeholderName, data.oldStatus, data.newStatus);
      break;
    case 'rejected':
      template = NotificationTemplates.stakeholder.rejected(data.stakeholderName, data.reason);
      break;
    case 'completed':
      template = NotificationTemplates.stakeholder.completed(data.stakeholderName);
      break;
    case 'stepCompleted':
      template = NotificationTemplates.stakeholder.stepCompleted(data.stakeholderName, data.stepName);
      break;
    case 'stepUpdated':
      template = NotificationTemplates.stakeholder.stepUpdated(data.stakeholderName, data.stepName);
      break;
    case 'stepRolledBack':
      template = NotificationTemplates.stakeholder.stepRolledBack(data.stakeholderName, data.stepName);
      break;
    case 'assignedToTeam':
      template = NotificationTemplates.stakeholder.assignedToTeam(data.stakeholderName, data.stepName, data.teamName);
      break;
    default:
      throw new Error('Invalid stakeholder notification type');
  }

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};

// Stakeholder issue notification helper
export const createStakeholderIssueNotification = async (
  recipientId: string,
  type: 'created' | 'assigned' | 'statusChanged' | 'resolved',
  data: any,
  options: { referenceId?: number; actionUrl?: string } = {}
) => {
  let template;
  
  switch (type) {
    case 'created':
      template = NotificationTemplates.stakeholderIssue.created(data.stakeholderName, data.issueTitle, data.priority);
      break;
    case 'assigned':
      template = NotificationTemplates.stakeholderIssue.assigned(data.stakeholderName, data.issueTitle);
      break;
    case 'statusChanged':
      template = NotificationTemplates.stakeholderIssue.statusChanged(data.stakeholderName, data.issueTitle, data.newStatus);
      break;
    case 'resolved':
      template = NotificationTemplates.stakeholderIssue.resolved(data.stakeholderName, data.issueTitle);
      break;
    default:
      throw new Error('Invalid stakeholder issue notification type');
  }

  const companyId = await getCompanyId();
  return await createSystemNotification(
    recipientId,
    template.title,
    template.message,
    companyId,
    {
      priority: template.priority,
      context: template.context,
      referenceId: options.referenceId,
      actionUrl: options.actionUrl,
    }
  );
};
