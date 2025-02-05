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
    <section className="overflow-y-scroll">
      <div className="flex items-center mx-auto px-6 w-fit">
        {navItems.map((item) => (
          <Link
            href={item.href}
            className="w-40 min-w-40 px-4 py-2 first:rounded-l-lg border-r last:border-r-0 border-black last:rounded-r-lg bg-[#D9D9D9] h-full flex items-center justify-center text-center"
            key={item.label}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
