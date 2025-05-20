import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | Flow",
  description: "View and manage your account settings",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50">{children}</main>
  );
} 