"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Buildings, 
  GlobeHemisphereWest, 
  Factory,
  Users,
  UserGear,
  House
} from "@phosphor-icons/react";
import { ROUTES } from "@/lib/constants";

const navItems = [
  {
    label: "Dashboard",
    href: ROUTES.SUPERADMIN.DASHBOARD,
    icon: House,
  },
  {
    label: "Companies",
    href: ROUTES.SUPERADMIN.COMPANIES,
    icon: Buildings,
  },
  {
    label: "Countries",
    href: ROUTES.SUPERADMIN.COUNTRIES,
    icon: GlobeHemisphereWest,
  },
  {
    label: "Industries",
    href: ROUTES.SUPERADMIN.INDUSTRIES,
    icon: Factory,
  },
  {
    label: "Teams",
    href: ROUTES.SUPERADMIN.TEAMS,
    icon: Users,
  },
  {
    label: "Superadmin Users",
    href: ROUTES.SUPERADMIN.USERS,
    icon: UserGear,
  },
];

export default function SuperadminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-md font-bold text-lg">
              SA
            </div>
            <span className="text-xl font-semibold text-gray-800">
              Flow Superadmin
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md
                    transition-colors duration-200
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon size={20} weight={isActive ? "fill" : "regular"} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <Link
            href="/home"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Exit to App →
          </Link>
        </div>
      </div>
    </nav>
  );
}
