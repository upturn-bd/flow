"use client";

import Link from "next/link";
import {
  ClipboardText, // Task
  ProjectorScreenChart, // Project
  ArrowsClockwise, // Process
  UsersThree, // Stakeholder
  SignIn, // Attendance
  CalendarX, // Leave
  Bell, // Notice
  HandWaving, // Requests
  Note, // Requisition
  CurrencyDollar,
  WarningCircle,
  Star, // Rating
  FolderSimple, // Digital Storage
  FileText, // Expenses
  Package, // Inventory
  UserPlus, // Onboarding
  SignOut, // Deboarding
  Money, // Payroll
  Gauge, // Performance
  ChartBar, // KPI
  File,
  MagnifyingGlass,
  BellSimple, // Reports
} from "@phosphor-icons/react";

const sections = [
  {
    title: "Workflow",
    items: [
      {
        name: "Task",
        path: "/opeartions-and-services/workflow/task",
        icon: ClipboardText,
      },
      {
        name: "Project",
        path: "/opeartions-and-services/workflow/project",
        icon: ProjectorScreenChart,
      },
    ],
  },
  {
    title: "Services",
    items: [
      {
        name: "Attendance",
        path: "/opeartions-and-services/services/attendance",
        icon: SignIn,
      },
      {
        name: "Leave",
        path: "/opeartions-and-services/services/leave",
        icon: CalendarX,
      },
      {
        name: "Notice",
        path: "/opeartions-and-services/services/notice",
        icon: Bell,
      },
      {
        name: "Requests",
        path: "/opeartions-and-services/services/requests",
        icon: HandWaving,
      },
      {
        name: "Requisition",
        path: "/opeartions-and-services/services/requisition",
        icon: Note,
      },
      {
        name: "Settlement",
        path: "/opeartions-and-services/services/settlement",
        icon: CurrencyDollar,
      },
      {
        name: "Complaint",
        path: "/opeartions-and-services/services/complaint",
        icon: WarningCircle,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        name: "Inventory",
        path: "/opeartions-and-services/operations/inventory",
        icon: Package,
      },
      {
        name: "Onboarding",
        path: "/operations-and-services/operations/onboarding",
        icon: UserPlus,
      },
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="max-w-6xl p-6 lg:px-20">
      <div className="flex items-center gap-4 py-4">
        <div className="flex items-center bg-white border border-gray-300 rounded-md px-4 py-2 w-full max-w-md shadow-sm">
          <input
            type="text"
            placeholder="Search"
            className="flex-grow outline-none text-sm text-gray-700 placeholder-gray-400"
          />
          <MagnifyingGlass size={20} className="text-gray-800" />
        </div>
        <button className="bg-[#0C1E46] text-white text-sm px-4 py-2 rounded-md shadow">
          Search
        </button>
        
      </div>

      {sections.map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-xl font-bold text-blue-800 mb-4">
            {section.title}
          </h2>
          <div className="flex items-center flex-wrap gap-4">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className="w-32 p-4 bg-white rounded-lg shadow-md transition-shadow flex flex-col items-center justify-center"
                >
                  <Icon size={40} className="text-blue-600 mb-2" />
                  <div className="text-center text-blue-600 font-medium">
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
