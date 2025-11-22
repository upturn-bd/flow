import { Metadata } from "next";
import SuperadminNav from "./nav";

export const metadata: Metadata = {
  title: "Superadmin | Flow HRIS",
  description: "Superadmin panel for managing the Flow HRIS platform",
};

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SuperadminNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
