"use client";

import { ArrowFatRight as ArrowFatRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { navItems } from "./nav-items";
import { getUserInfo } from "@/lib/auth/getUser";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
  const [user, setUser] = useState<
      { id: string; name: string; role: string } | undefined
    >();
  
    useEffect(() => {
      async function fetchUserData() {
        try {
          const user = await getUserInfo();
          setUser(user);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
      fetchUserData();
    }, []);

  return (
    <div
      className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 h-20 rounded-t-lg block md:hidden"
      style={{
        background: "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
      }}
    >
      <nav className="relative w-full h-full flex items-center text-white">
        {navItems
          .filter((item) => item.label !== "admin-management")
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.label}
                className="px-3 flex-1 flex items-center justify-center border-r last:border-r-0 border-zinc-600"
              >
                <Icon size={30} />
              </Link>
            );
          })}
        {user?.role === "Admin" &&
          navItems
            .filter((item) => item.label === "admin-management")
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="px-3 flex-1 flex items-center justify-center border-r last:border-r-0 border-zinc-600"
                >
                  <Icon size={30} />
                </Link>
              );
            })}
      </nav>
    </div>
  );
}
