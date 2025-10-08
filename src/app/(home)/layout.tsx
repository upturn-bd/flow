"use client";

import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import Sidebar from "./side-navbar";
import TopBar from "./top-bar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ApprovalLayout>{children}</ApprovalLayout>
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
