import Link from "next/link";
import React from "react";

const navItems = [
  {
    label: "Basic Information",
    href: "/",
  },
  {
    label: "Personal Information",
    href: "/",
  },
  {
    label: "Education & Experience",
    href: "/",
  },
  {
    label: "Key Performance Indicator",
    href: "/",
  },
  {
    label: "Performance Evaluation",
    href: "/",
  },
];

export default function TopNavigation() {
  return (
    <div className="flex justify-center">
      <div className="bg-[#D9D9D9] flex items-center rounded-lg divide-x">
        {navItems.map((item) => (
          <Link
            href={item.href}
            className="text-center w-40 py-2 px-4 border-black"
            key={item.label}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
