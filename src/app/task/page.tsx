import React from "react";
import {
  Note as NoteIcon,
  ChartBar as ChartBarIcon,
  ArrowsClockwise as ArrowsClockwiseIcon,
  Users as UsersIcon,
  FileText as FileTextIcon,
  CurrencyDollar as CurrencyDollarIcon,
  Buildings as BuildingsIcon,
} from "@phosphor-icons/react/dist/ssr";

const navItems = [
  {
    category: "Create your Workflow",
    items: [
      { label: "Task", icon: NoteIcon, href: "/task" },
      { label: "Project", icon: ChartBarIcon, href: "/project" },
      { label: "Process", icon: ArrowsClockwiseIcon, href: "/process" },
      { label: "Stakeholder", icon: UsersIcon, href: "/stakeholder" },
    ],
    gridCols: "grid-cols-4", // Layout for this section
  },
  {
    category: "Operations",
    items: [
      { label: "Expenses", icon: FileTextIcon, href: "/expenses" },
      { label: "Non-cash items", icon: CurrencyDollarIcon, href: "/non-cash-items" },
      { label: "Roles, JD & KPI", icon: BuildingsIcon, href: "/roles-jd-kpi" },
    ],
    gridCols: "grid-cols-3", // Layout for this section
  },
];

export default function Page() {
  return (
    <div className="container mx-auto p-6">
      {navItems.map((section) => (
        <div key={section.category} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{section.category}</h2>
          <div className={`grid ${section.gridCols} gap-4`}>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  href={item.href}
                  key={item.label}
                  className="w-32 h-32 flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-md p-4 hover:bg-gray-100 transition"
                >
                  <Icon size={45} className="text-blue-500" />
                  <p className="mt-2 text-sm text-gray-700">{item.label}</p>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
