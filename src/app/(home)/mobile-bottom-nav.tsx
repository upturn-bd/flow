"use client";

import { cn } from "@/components/ui/class";
import { motion } from "framer-motion";
import Link from "next/link";
import { navItems } from "./nav-items";
import { getEmployeeInfo } from "@/lib/api/employee";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const [user, setUser] = useState<
    { id: string; name: string; role: string } | undefined
  >();
  const pathname = usePathname();
  
  useEffect(() => {
    async function fetchUserData() {
      try {
        const user = await getEmployeeInfo();
        setUser(user);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    }
    fetchUserData();
  }, []);

  // Animation variants
  const navVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const filteredNavItems = [
    ...navItems.filter(item => item.label !== "admin-management"),
    ...(user?.role === "Admin" 
      ? navItems.filter(item => item.label === "admin-management") 
      : [])
  ];

  // Limit to maximum 5 items on mobile
  const displayItems = filteredNavItems.slice(0, 5);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className="fixed bottom-0 inset-x-0 z-50 h-[72px] block md:hidden shadow-lg"
      style={{
        background: "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
        borderTop: "1px solid rgba(59, 130, 246, 0.2)",
      }}
    >
      <nav className="flex justify-evenly h-full">
        {displayItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <motion.div
              key={item.label}
              variants={itemVariants}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center h-full"
              >
                <div className={cn(
                  "flex flex-col items-center justify-center",
                  isActive 
                    ? "text-yellow-400" 
                    : "text-slate-400"
                )}>
                  <div className={cn(
                    "p-2",
                    isActive && "bg-blue-900/20 rounded-xl"
                  )}>
                    <Icon 
                      size={22} 
                      weight={isActive ? "fill" : "regular"} 
                    />
                  </div>
                  {/* <span className="text-[9px] font-medium mt-1 px-1">
                    {item.label.charAt(0).toUpperCase() + item.label.slice(1).replace(/-/g, " ")}
                  </span> */}
                </div>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 w-12 h-1 bg-blue-400 rounded-t-md"
                    style={{ marginBottom: "-1px" }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.div>
  );
}
