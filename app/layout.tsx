import type { Metadata } from "next";
import { Ubuntu_Sans } from "next/font/google";
import "./globals.css";

import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";

import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const ubuntu = Ubuntu_Sans({
  subsets: ["latin"],
  variable: "--font-ubuntu-sans",
});

export const metadata: Metadata = {
  title: "Revix — AI Review Analyzer",
  description:
    "Revix analyzes customer reviews and generates a reliable 1–10 product score with insights.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning className={cn("min-h-screen antialiased", ubuntu.variable)}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Layout wrapper to keep footer at bottom */}
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
