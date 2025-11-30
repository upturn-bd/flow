import { Metadata } from "next";
import SuperadminNav from "./nav";
import { Toaster } from "sonner";

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
    <div className="min-h-screen bg-background-secondary dark:bg-background-primary">
      <SuperadminNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
