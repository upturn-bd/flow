"use client";

import Link from "next/link";
import { navItems } from "../src/app/(home)/nav-items";
import { useEffect, useState } from "react";
import { getUserInfo } from "@/lib/api/company-info/employees";
import Image from "next/image";

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
      className="w-[80px] fixed h-dvh md:flex flex-col items-center justify-center hidden"
      style={{
        background: "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
      }}
    >
      <div className="absolute top-10 right-0 translate-x-1/3 p-5 rounded-full bg-[#001731] flex items-center justify-center">
        <Link href="/home">
          <Image width={50} height={50} src="/nav-logo.png" alt="Logo" />
        </Link>
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
