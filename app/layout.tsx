import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CommandMenu } from "@/components/ui/command-menu";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Academix — Education Operations OS",
    template: "%s · Academix",
  },
  description: "Run student records, classes, attendance, assessments, fee collections, communications and reporting from one education operations workspace.",
  applicationName: "Academix",
  keywords: ["student management", "education SaaS", "attendance", "tuition management", "institute management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider defaultTheme="light" storageKey="academix-theme">
          <CommandMenu />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
