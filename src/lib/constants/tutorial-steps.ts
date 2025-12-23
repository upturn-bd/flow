/**
 * Tutorial Steps Configuration
 * Contains all 14 feature tutorials with their individual steps
 */

// ============================================================================
// Types
// ============================================================================

export interface TutorialStep {
    /** CSS selector or data-tutorial attribute value */
    target: string;
    /** Step title */
    title: string;
    /** Step content/description */
    content: string;
    /** Tooltip placement relative to target */
    placement?: "top" | "bottom" | "left" | "right";
    /** Route where this step applies */
    route: string;
}

export interface FeatureTutorial {
    /** Unique tutorial identifier (matches feature name) */
    id: string;
    /** Display name */
    name: string;
    /** Brief description */
    description: string;
    /** Starting route for this tutorial */
    route: string;
    /** Icon name (from Phosphor) */
    icon: string;
    /** Tutorial steps */
    steps: TutorialStep[];
}

// ============================================================================
// Tutorial Definitions
// ============================================================================

export const FEATURE_TUTORIALS: FeatureTutorial[] = [
    // -------------------------------------------------------------------------
    // 1. Task Tutorial
    // -------------------------------------------------------------------------
    {
        id: "task",
        name: "Task Management",
        description: "Learn how to create, assign, and track tasks",
        route: "/ops/tasks",
        icon: "ClipboardText",
        steps: [
            {
                target: "[data-tutorial='task-header']",
                title: "Welcome to Task Management",
                content: "Your central hub for assigning and tracking day-to-day work across your team.",
                placement: "bottom",
                route: "/ops/tasks",
            },
            {
                target: "[data-tutorial='task-create-btn']",
                title: "Create a New Task",
                content: "Click here to create a new task. Assign it to team members, set priorities, and add deadlines.",
                placement: "left",
                route: "/ops/tasks",
            },
            {
                target: "[data-tutorial='task-ongoing-tab']",
                title: "Ongoing Tasks",
                content: "View all active tasks that need attention. Filter and sort to find what matters most.",
                placement: "bottom",
                route: "/ops/tasks",
            },
            {
                target: "[data-tutorial='task-completed-tab']",
                title: "Completed Tasks",
                content: "Browse finished tasks and review past work. Great for tracking team productivity.",
                placement: "bottom",
                route: "/ops/tasks?tab=completed",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 2. Project Tutorial
    // -------------------------------------------------------------------------
    {
        id: "project",
        name: "Project Management",
        description: "Manage complex initiatives with milestones",
        route: "/ops/project",
        icon: "ChartBar",
        steps: [
            {
                target: "[data-tutorial='project-header']",
                title: "Project Management",
                content: "Plan and execute complex initiatives with milestones, timelines, and team assignments.",
                placement: "bottom",
                route: "/ops/project",
            },
            {
                target: "[data-tutorial='project-ongoing-tab']",
                title: "Ongoing Projects",
                content: "View all active projects and monitor their progress toward completion.",
                placement: "bottom",
                route: "/ops/project?tab=ongoing",
            },
            {
                target: "[data-tutorial='project-create-tab']",
                title: "Create New Project",
                content: "Start a new project by defining objectives, milestones, and team members.",
                placement: "bottom",
                route: "/ops/project",
            },
            {
                target: "[data-tutorial='project-completed-tab']",
                title: "Completed Projects",
                content: "Review finished projects and their outcomes for future reference.",
                placement: "bottom",
                route: "/ops/project?tab=completed",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 3. Attendance Tutorial
    // -------------------------------------------------------------------------
    {
        id: "attendance",
        name: "Attendance",
        description: "Track your daily check-in and check-out",
        route: "/ops/attendance",
        icon: "SignIn",
        steps: [
            {
                target: "[data-tutorial='attendance-header']",
                title: "Attendance Tracking",
                content: "Track your daily attendance with easy check-in and check-out functionality.",
                placement: "bottom",
                route: "/ops/attendance",
            },
            {
                target: "[data-tutorial='attendance-today-tab']",
                title: "Today's Attendance",
                content: "Check in and out for today. Select your work site if you work from multiple locations.",
                placement: "bottom",
                route: "/ops/attendance?tab=today",
            },
            {
                target: "[data-tutorial='attendance-records-tab']",
                title: "Attendance Records",
                content: "View your complete attendance history with dates, times, and status.",
                placement: "bottom",
                route: "/ops/attendance?tab=records",
            },
            {
                target: "[data-tutorial='attendance-request-tab']",
                title: "Attendance Requests",
                content: "Submit requests to correct attendance issues or explain late arrivals.",
                placement: "bottom",
                route: "/ops/attendance?tab=request",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 4. Leave Tutorial
    // -------------------------------------------------------------------------
    {
        id: "leave",
        name: "Leave Management",
        description: "Apply for time off and track leave balance",
        route: "/ops/leave",
        icon: "CalendarX",
        steps: [
            {
                target: "[data-tutorial='leave-header']",
                title: "Leave Management",
                content: "Apply for time off and track your leave balance effortlessly.",
                placement: "bottom",
                route: "/ops/leave",
            },
            {
                target: "[data-tutorial='leave-apply-tab']",
                title: "Apply for Leave",
                content: "Submit a new leave request with dates, type, and reason.",
                placement: "bottom",
                route: "/ops/leave",
            },
            {
                target: "[data-tutorial='leave-history-tab']",
                title: "Leave History",
                content: "View all your past and pending leave applications.",
                placement: "bottom",
                route: "/ops/leave?tab=history",
            },
            {
                target: "[data-tutorial='leave-requests-tab']",
                title: "Team Requests",
                content: "Approve or review leave requests from your team (supervisors only).",
                placement: "bottom",
                route: "/ops/leave?tab=requests",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 5. Notice Tutorial
    // -------------------------------------------------------------------------
    {
        id: "notice",
        name: "Notices",
        description: "Stay updated with company announcements",
        route: "/ops/notice",
        icon: "Bell",
        steps: [
            {
                target: "[data-tutorial='notice-header']",
                title: "Company Notices",
                content: "Stay updated with important company announcements and alerts.",
                placement: "bottom",
                route: "/ops/notice",
            },
            {
                target: "[data-tutorial='notice-create-btn']",
                title: "Create Notice",
                content: "Post a new notice for your team (requires appropriate permissions).",
                placement: "left",
                route: "/ops/notice",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 6. Requisition Tutorial
    // -------------------------------------------------------------------------
    {
        id: "requisition",
        name: "Requisition",
        description: "Request equipment, supplies, and resources",
        route: "/ops/requisition",
        icon: "Clipboard",
        steps: [
            {
                target: "[data-tutorial='requisition-header']",
                title: "Requisition Management",
                content: "Submit and track resource requests for your department in real-time.",
                placement: "bottom",
                route: "/ops/requisition",
            },
            {
                target: "[data-tutorial='requisition-create-tab']",
                title: "Create Requisition",
                content: "Submit a new request for equipment, supplies, or services.",
                placement: "bottom",
                route: "/ops/requisition?tab=create",
            },
            {
                target: "[data-tutorial='requisition-history-tab']",
                title: "My Requests",
                content: "Track the status of all your submitted requisitions.",
                placement: "bottom",
                route: "/ops/requisition?tab=history",
            },
            {
                target: "[data-tutorial='requisition-requests-tab']",
                title: "Pending Approval",
                content: "Review and approve requisitions (if you have authorization).",
                placement: "bottom",
                route: "/ops/requisition?tab=requests",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 7. Settlement Tutorial
    // -------------------------------------------------------------------------
    {
        id: "settlement",
        name: "Settlement",
        description: "Submit and track expense reimbursements",
        route: "/ops/settlement",
        icon: "CurrencyDollar",
        steps: [
            {
                target: "[data-tutorial='settlement-header']",
                title: "Expense Settlement",
                content: "Request expense reimbursements and track approval status instantly.",
                placement: "bottom",
                route: "/ops/settlement",
            },
            {
                target: "[data-tutorial='settlement-create-tab']",
                title: "Submit Expense",
                content: "Submit a new expense claim with amount and supporting documents.",
                placement: "bottom",
                route: "/ops/settlement",
            },
            {
                target: "[data-tutorial='settlement-history-tab']",
                title: "Settlement History",
                content: "View all your past settlement requests and their status.",
                placement: "bottom",
                route: "/ops/settlement?tab=history",
            },
            {
                target: "[data-tutorial='settlement-requests-tab']",
                title: "Pending Settlements",
                content: "Review settlements awaiting your approval.",
                placement: "bottom",
                route: "/ops/settlement?tab=requests",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 8. Complaint Tutorial
    // -------------------------------------------------------------------------
    {
        id: "complaint",
        name: "Complaints",
        description: "Report workplace concerns confidentially",
        route: "/ops/complaint",
        icon: "WarningCircle",
        steps: [
            {
                target: "[data-tutorial='complaint-header']",
                title: "Complaint Management",
                content: "Report workplace concerns confidentially and monitor resolution progress.",
                placement: "bottom",
                route: "/ops/complaint",
            },
            {
                target: "[data-tutorial='complaint-action-btn']",
                title: "New Complaint",
                content: "Click to submit a new complaint. All submissions are kept confidential.",
                placement: "left",
                route: "/ops/complaint",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 9. Payroll Tutorial
    // -------------------------------------------------------------------------
    {
        id: "payroll",
        name: "Payroll",
        description: "View salary details and payment history",
        route: "/ops/payroll",
        icon: "CreditCard",
        steps: [
            {
                target: "[data-tutorial='payroll-header']",
                title: "Payroll Information",
                content: "View your salary details, payslips, and payment history securely.",
                placement: "bottom",
                route: "/ops/payroll",
            },
            {
                target: "[data-tutorial='payroll-pending-tab']",
                title: "Pending Payrolls",
                content: "View payroll entries awaiting processing.",
                placement: "bottom",
                route: "/ops/payroll",
            },
            {
                target: "[data-tutorial='payroll-published-tab']",
                title: "Published Payrolls",
                content: "See approved payroll records ready for payment.",
                placement: "bottom",
                route: "/ops/payroll",
            },
            {
                target: "[data-tutorial='payroll-paid-tab']",
                title: "Paid Payrolls",
                content: "Browse all completed and paid payroll records.",
                placement: "bottom",
                route: "/ops/payroll",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 10. Stakeholders Tutorial
    // -------------------------------------------------------------------------
    {
        id: "stakeholders",
        name: "Stakeholders",
        description: "Manage client and vendor relationships",
        route: "/ops/stakeholders",
        icon: "Building",
        steps: [
            {
                target: "[data-tutorial='stakeholders-header']",
                title: "Stakeholder Management",
                content: "Manage client and vendor relationships with complete visibility.",
                placement: "bottom",
                route: "/ops/stakeholders",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 11. Tickets Tutorial
    // -------------------------------------------------------------------------
    {
        id: "tickets",
        name: "Tickets",
        description: "Track and resolve stakeholder issues",
        route: "/ops/stakeholder-issues",
        icon: "Ticket",
        steps: [
            {
                target: "[data-tutorial='tickets-header']",
                title: "Issue Tickets",
                content: "Track and resolve stakeholder issues assigned to you efficiently.",
                placement: "bottom",
                route: "/ops/stakeholder-issues",
            },
            {
                target: "[data-tutorial='tickets-create-btn']",
                title: "Create Ticket",
                content: "Click to create a new ticket for a stakeholder issue.",
                placement: "left",
                route: "/ops/stakeholder-issues",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 12. Onboarding Tutorial
    // -------------------------------------------------------------------------
    {
        id: "onboarding",
        name: "Onboarding",
        description: "Complete your onboarding checklist",
        route: "/ops/onboarding",
        icon: "UserPlus",
        steps: [
            {
                target: "[data-tutorial='onboarding-header']",
                title: "Employee Onboarding",
                content: "View and approve new employee onboarding requests.",
                placement: "bottom",
                route: "/ops/onboarding",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 13. Offboarding Tutorial
    // -------------------------------------------------------------------------
    {
        id: "offboarding",
        name: "Offboarding",
        description: "Manage exit processes and handovers",
        route: "/ops/offboarding",
        icon: "UserMinus",
        steps: [
            {
                target: "[data-tutorial='offboarding-header']",
                title: "Employee Offboarding",
                content: "Manage exit processes and ensure smooth handovers.",
                placement: "bottom",
                route: "/ops/offboarding",
            },
        ],
    },

    // -------------------------------------------------------------------------
    // 14. HRIS Tutorial
    // -------------------------------------------------------------------------
    {
        id: "hris",
        name: "HRIS",
        description: "Access employee directory and org info",
        route: "/ops/hris",
        icon: "Users",
        steps: [
            {
                target: "[data-tutorial='hris-header']",
                title: "HRIS - Employee Directory",
                content: "Access the employee directory and organizational information.",
                placement: "bottom",
                route: "/ops/hris",
            },
        ],
    },
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get a tutorial by ID
 */
export function getTutorialById(id: string): FeatureTutorial | undefined {
    return FEATURE_TUTORIALS.find((t) => t.id === id);
}

/**
 * Get tutorial for a specific route
 */
export function getTutorialByRoute(route: string): FeatureTutorial | undefined {
    return FEATURE_TUTORIALS.find((t) => route.startsWith(t.route));
}

/**
 * Get all tutorial IDs
 */
export function getAllTutorialIds(): string[] {
    return FEATURE_TUTORIALS.map((t) => t.id);
}
