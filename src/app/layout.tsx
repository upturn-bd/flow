// import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Upturn",
//   description: "Upturn",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>
          {/* {metadata.title} */}
          Upturn
        </title>
        <meta
          name="description"
          content={
            // metadata.description
            "Your all in one business solution"
          } />
      </head>
      <body className={`${geistSans.className} antialiased`}>{children}</body>
    </html>
  );
}
