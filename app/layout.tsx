import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CommandMenu } from "@/components/ui/command-menu";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Student Management System",
  description: "A comprehensive student management system built with Next.js 14, TypeScript, and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider defaultTheme="system" storageKey="sms-theme">
          <CommandMenu />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
