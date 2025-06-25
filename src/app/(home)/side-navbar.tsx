"use client";

import { cn } from "@/components/ui/class";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function Sidebar() {
  const { employeeInfo, isApproved, getAuthorizedNavItems } = useAuth();
  const pathname = usePathname();
  const navItems = getAuthorizedNavItems();

  // Animation variants
  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        delay: 0.2, 
        duration: 0.5,
        type: "spring",
        stiffness: 300
      }
    }
  };

  // Hide the sidebar for unapproved users
  if (!isApproved) {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="w-20 fixed left-0 top-0 h-screen md:flex flex-col hidden shadow-xl z-50"
      style={{
        background: "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
      }}
    >
      <motion.div 
        variants={logoVariants}
        className="absolute top-8 left-1/3 -translate-x-1/2 w-20 h-20 rounded-full bg-[#001731] flex items-center justify-center shadow-lg"
      >
        <Link href="/home" className="p-6">
          <Image 
            width={100} 
            height={100} 
            src="/nav-logo.png" 
            alt="Logo"
            className="object-contain"
          />
        </Link>
      </motion.div>

      <motion.nav
        variants={sidebarVariants} 
        className="flex flex-col items-center w-full mt-32 space-y-8"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          if(item.href === "/home"){
            return (<div key="none"></div>);
          }
          
          return (
            <motion.div
              key={item.label}
              variants={itemVariants}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-full flex justify-center"
            >
              <Link 
                href={item.href}
                className={cn(
                  "flex items-center justify-center h-14 w-14 rounded-md transition-colors",
                  isActive ? "text-yellow-400" : "text-gray-300 hover:text-white"
                )}
                title={item.label.charAt(0).toUpperCase() + item.label.slice(1).replace(/-/g, " ")}
              >
                <Icon size={40} weight={isActive ? "fill" : "regular"} />
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-indicator" 
                    className="absolute left-0 w-1 h-12 bg-yellow-400 rounded-r-md"
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    </motion.div>
  );
}
