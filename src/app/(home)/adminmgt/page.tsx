import React from "react";
import {
  Note as NoteIcon,
  ChartBar as ChartBarIcon,
  FileText as FileTextIcon,
  CurrencyDollar as CurrencyDollarIcon,
  Buildings as BuildingsIcon,
} from "@phosphor-icons/react/dist/ssr";

const navItems = [
  {
    category: "Office Attendance",
    items: [
      { label: "Attendance", icon: NoteIcon, href: "/attendance" },
      { label: "View Data", icon: FileTextIcon, href: "/viewdata" },
    ],
  },
  {
    category: "Requests",
    items: [
      { label: "Leave", icon: FileTextIcon, href: "/Leave" },
      { label: "Feedback", icon: ChartBarIcon, href: "/feedback" },
      { label: "complaint", icon: CurrencyDollarIcon, href: "/complaint" },
      { label: "Requisition", icon: BuildingsIcon, href: "/requisition" },
    ],
  },
];

export default function Page() {
  return (
    <div className="container mx-auto p-6">
      {navItems.map((section) => (
        <div key={section.category} className="mb-8">
          <h2 className="text-3xl text-blue-600 font-semibold mb-4">{section.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4">
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
