"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Bell, User, Search, LogOut, UserCircle, ShieldAlert, Moon, Sun } from "@/lib/icons";
import { supabase } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

export default function TopBar() {
  const { employeeInfo, isApproved } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [newNotificationModal, setNewNotificationModal] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null!);
  const router = useRouter();
  const pathname = usePathname();
  
  // Notification hook
  const { 
    fetchUnreadCount, 
    unreadCount, 
    fetchUserNotifications,
    markAsRead,
    deleteNotification 
  } = useNotifications();

  // Check for new notifications
  const checkForNewNotifications = async () => {
    const currentCount = await fetchUnreadCount();
    
    // If count increased, fetch the latest notification
    if (currentCount > previousUnreadCount && previousUnreadCount > 0) {
      const notifications = await fetchUserNotifications(1);
      if (notifications && notifications.length > 0) {
        const newest = notifications[0];
        // Only show if it's unread
        if (!newest.is_read) {
          setLatestNotification(newest);
          setNewNotificationModal(true);
        }
      }
    }
    
    setPreviousUnreadCount(currentCount);
  };

  // Initial fetch and polling
  useEffect(() => {
    if (isApproved) {
      const initFetch = async () => {
        const count = await fetchUnreadCount();
        setPreviousUnreadCount(count);
      };
      
      initFetch();
      const interval = setInterval(checkForNewNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isApproved, fetchUnreadCount, previousUnreadCount]);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const basePath = `/${pathname.split('/')[1]}`;
  const isAuthorized = isApproved || basePath === "/account";

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    await fetchUnreadCount();
  };

  const handleDeleteNotification = async (id: number) => {
    await deleteNotification(id);
    await fetchUnreadCount();
  };

  if (!isAuthorized) return null;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-[50] h-16">
      <div className="pr-4 md:pr-6 h-full flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          {!isApproved && (
            <div className="flex items-center text-amber-600">
              <ShieldAlert className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium hidden md:inline">Restricted access</span>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-1 md:space-x-3">
          {isApproved && (
            <>
              <div className="relative">
                <button className="p-2 rounded-full hover:bg-surface-hover text-foreground-tertiary transition-colors">
                  <Search className="h-5 w-5" />
                </button>
              </div>
              
              <div className="relative">
                <button 
                  onClick={toggleMode}
                  className="p-2 rounded-full hover:bg-surface-hover text-foreground-tertiary transition-colors"
                  title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {mode === 'light' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <div className="relative">
                <button 
                  ref={notificationButtonRef}
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="p-2 rounded-full hover:bg-surface-hover text-foreground-tertiary transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface-primary rounded-md shadow-lg py-2 z-[1100] border border-border-primary">
                    <NotificationDropdown
                      isOpen={notificationDropdownOpen}
                      onClose={() => setNotificationDropdownOpen(false)}
                      triggerRef={notificationButtonRef}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center px-2 py-1 rounded-full hover:bg-surface-hover transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border border-primary-200">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <span className="ml-2 text-sm font-medium text-foreground-secondary hidden md:inline-block">
                {employeeInfo?.name || 'Profile'}
              </span>
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-primary rounded-md shadow-lg py-1 z-[1100] border border-border-primary">
                <div className="px-4 py-2 border-b border-border-primary">
                  <p className="text-sm font-medium text-foreground-primary">{employeeInfo?.name || 'User'}</p>
                  <p className="text-xs text-foreground-tertiary">{employeeInfo?.role || 'Role'}</p>
                  {!isApproved && (
                    <p className="text-xs mt-1 text-amber-500">Pending approval</p>
                  )}
                </div>

                <Link 
                  href="/profile" 
                  className="px-4 py-2 text-sm text-foreground-secondary hover:bg-surface-hover flex items-center"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  My Account
                </Link>

                {/* <Link 
                  href="/account/settings" 
                  className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link> */}

                <div className="border-t border-border-primary mt-1">
                  <button 
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center"
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

    {/* New Notification Modal */}
    <NewNotificationModal
      notification={latestNotification}
      isOpen={newNotificationModal}
      onClose={() => setNewNotificationModal(false)}
      onMarkAsRead={handleMarkAsRead}
      onDelete={handleDeleteNotification}
    />
    </>
  );
}
