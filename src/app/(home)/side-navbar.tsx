"use client";

import Link from "next/link";
import { ArrowFatRight as ArrowFatRightIcon } from "@phosphor-icons/react";
import { navItems } from "./nav-items";
import { useEffect, useState } from "react";
import { getUserInfo } from "@/lib/auth/getUser";

export default function Sidebar() {
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
      className="w-[100px] fixed h-dvh md:flex flex-col items-center justify-center hidden"
      style={{
        background: "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
      }}
    >
      <div className="absolute top-10 right-0 translate-x-1/3 p-5 rounded-full bg-[#001731] flex items-center justify-center">
        <ArrowFatRightIcon
          size={70}
          className="-rotate-45 text-yellow-500"
          weight="fill"
        />
      </div>
      <nav className="absolute top-[30%] w-full flex flex-col gap-6 items-center text-white">
        {navItems
          .filter((item) => item.label !== "admin-management")
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.label}>
                <Icon size={45} />
              </Link>
            );
          })}
        {user?.role === "Admin" &&
          navItems
            .filter((item) => item.label === "admin-management")
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link href={item.href} key={item.label}>
                  <Icon size={45} />
                </Link>
              );
            })}
      </nav>
    </div>
  );
}
