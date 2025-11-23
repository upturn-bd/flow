"use client";

import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { DataContextProvider } from "@/contexts/DataContextProvider";
import Sidebar from "./side-navbar";
import TopBar from "./top-bar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DataContextProvider>
        <ApprovalLayout>{children}</ApprovalLayout>
      </DataContextProvider>
    </AuthProvider>
  );
}

function ApprovalLayout({ children }: { children: React.ReactNode }) {
  const { isApproved } = useAuth();

  return (
    <div className="flex h-dvh w-full overflow-x-hidden">
      {isApproved && <Sidebar />}
      <div className="flex-1 flex flex-col h-full w-full overflow-x-hidden">
        {isApproved && <TopBar />}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-36 md:pb-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
