"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Bell, User, Search, Menu } from "lucide-react";
import { getUserInfo } from "@/lib/auth/getUser";

export default function TopBar() {
  const [user, setUser] = useState<{ id: string; name: string; role: string } | undefined>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userData = await getUserInfo();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    }
    fetchUserData();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-5 h-16">
      <div className="px-4 md:px-6 h-full flex items-center justify-end">
        {/* Left side */}
        {/* <div className="flex items-center">
          <button 
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
          
          <div className="hidden md:flex items-center">
            <span className="font-medium text-gray-800">Flow</span>
          </div>
        </div> */}

        {/* Right side */}
        <div className="flex items-center space-x-1 md:space-x-3">
          <div className="relative">
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
          
          <Link 
            href="/notifications"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </Link>

          <Link 
            href="/profile"
            className="flex items-center px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 hidden md:inline-block">
              {user?.name || 'Profile'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
} 