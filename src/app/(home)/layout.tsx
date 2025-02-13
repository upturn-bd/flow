import React from "react";

import Sidebar from "./sidebar";

import MobileBottomNav from "./mobile-bottom-nav";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr]">
      <Sidebar />
      <MobileBottomNav />
      <div className="mt-32">
        <main>{children}</main>
      </div>
    </div>
  );
}
