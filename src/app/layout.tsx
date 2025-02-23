"use client";

import { Geist } from "next/font/google";

import "./globals.css";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // check supabase auth
  useEffect(() => {
    // TODO do something better
    async function checkLogin() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (!data.user) {
        // Navigate to login page
        if (typeof window !== "undefined") {
          if (
            !window.location.pathname.startsWith("/signin") &&
            !window.location.pathname.startsWith("/signup")
          )
            //redirect to login page
            window.location.href = "/signin";
        }
      } else {
        console.log(data);
      }
    }

    checkLogin();
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>{children}</body>
    </html>
  );
}
