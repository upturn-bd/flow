"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Bell, User, Search, Menu, LogOut, Settings, UserCircle } from "lucide-react";
import { getUserInfo } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const [user, setUser] = useState<{ id: string; name: string; role: string } | undefined>();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
  
  // Close the user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

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

          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden md:inline-block">
                {user?.name || 'Profile'}
              </span>
            </button>
            
            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Role'}</p>
                </div>
                
                <Link 
                  href="/account" 
                  className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  My Account
                </Link>
                
                <Link 
                  href="/account/settings" 
                  className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
                
                <div className="border-t border-gray-100 mt-1">
                  <button 
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className=" w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 