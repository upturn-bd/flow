import React from "react";

import Sidebar from "./sidebar";
import TopNavigation from "./top-navigation";
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[100px_1fr]">
      <Sidebar />
      <div className="mt-32">
        <TopNavigation />
        <main>{children}</main>
      </div>
    </div>
  );
}
