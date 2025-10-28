"use client";

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
      { label: "Task", icon: NoteIcon, href: "/tasks" },
      { label: "Project", icon: ChartBarIcon, href: "/project" },
      { label: "Process", icon: ArrowsClockwiseIcon, href: "/process" },
      { label: "Stakeholder", icon: UsersIcon, href: "/stakeholder" },
    ],
  },
  {
    category: "Operations",
    items: [
      { label: "Expenses", icon: FileTextIcon, href: "/expenses" },
      { label: "Non-cash items", icon: CurrencyDollarIcon, href: "/non-cash-items" },
      { label: "Roles, JD & KPI", icon: BuildingsIcon, href: "/roles-jd-kpi" },
    ],
  },
];

export default function Page() {
  return (
    <div className=" ">
      {navItems.map((section) => (
        <div key={section.category} className="mb-8">
          <h2 className="text-3xl text-blue-600 font-semibold mb-4">{section.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  href={item.href}
                  key={item.label}
                  className="w-60 h-40 flex flex-col items-center justify-center border border-gray-300 rounded-lg shadow-md p-4 hover:bg-gray-100 transition"
                >
                  <Icon size={72} className="text-blue-500" />
                  <p className="mt-2 text-xl text-gray-700">{item.label}</p>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
