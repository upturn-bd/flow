import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/profile/", label: "Basic Information" },
  { href: "/profile/personal-info", label: "Personal Information" },
  { href: "/profile/education-and-experience", label: "Education & Experience" },
];

export function ProfileTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-center gap-2 bg-white/80 rounded-xl shadow-sm mb-10 p-1 border border-gray-100">
      {tabs.map((tab, idx) => {
        const isActive =
          tab.href === "/profile/"
            ? pathname === "/profile" || pathname === "/profile/"
            : pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
              ${isActive
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"}
            `}
            tabIndex={0}
          >
            {tab.label}
            {isActive && (
              <span className="absolute left-2 right-2 -bottom-1 h-1 rounded-full bg-blue-500" />
            )}
          </Link>
        );
      })}
    </div>
  );
}