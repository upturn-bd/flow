"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { getEmployeeInfo } from "@/lib/api";
import { navItems } from "@/app/(home)/nav-items";

export type EmployeeInfo = {
  id: string;
  name: string;
  role: string;
  has_approval: string;
  company_id?: string | number;
  supervisor_id?: string | null;
  department_id?: string | number;
  email?: string;
  phone_number?: string;
  designation?: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  employeeInfo: EmployeeInfo | null;
  isApproved: boolean;
  getAuthorizedNavItems: () => typeof navItems;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [employeeDataLoading, setEmployeeDataLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch employee data when user changes
  useEffect(() => {
    async function fetchEmployeeData() {
      setEmployeeDataLoading(true);
      if (!user) {
        setEmployeeInfo(null);
        return;
      }

      try {
        const data = await getEmployeeInfo();
        setEmployeeInfo(data);
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
        setEmployeeInfo(null);
      } finally {
        setEmployeeDataLoading(false);
      }
    }

    fetchEmployeeData();
  }, [user]);

  // Determine if the user is approved
  const isApproved = employeeInfo?.has_approval === "ACCEPTED";

  // Function to get navigation items based on user role and approval
  const getAuthorizedNavItems = () => {
    if (!employeeInfo || !isApproved) {
      return [];
    }
    
    return navItems.filter(item => 
      item.roles?.includes(employeeInfo.role) ?? false
    );
  };

  const value = {
    user,
    session,
    isLoading: isLoading || employeeDataLoading,
    employeeInfo,
    isApproved,
    getAuthorizedNavItems
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
