"use client";

import * as React from "react";
import { Menu, SidebarOpenIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen w-full">
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <div
          className={cn(
            "hidden md:flex md:flex-col",
            "h-screen sticky top-0",
            "transition-all duration-200",
            collapsed ? "md:w-19" : "md:w-70"
          )}
        >
          <DashboardSidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
          />
        </div>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <div className="sticky top-0 z-40 bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              {/* Mobile menu button */}
              <div className="flex items-center gap-2 md:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Open menu">
                      <SidebarOpenIcon className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>

                  {/* ✅ FIX: Add SheetHeader + SheetTitle inside SheetContent */}
                  <SheetContent side="left" className="p-0">
                    {/* Accessibility header (can be visually minimal) */}
                    <div className="px-4 py-3">
                      <SheetHeader>
                        <SheetTitle>Dashboard navigation</SheetTitle>
                        {/* Optional, but nice for SR users */}
                        <SheetDescription className="sr-only">
                          Use the links to navigate between dashboard pages.
                        </SheetDescription>
                      </SheetHeader>
                    </div>

                    <Separator />

                    <div className="h-[calc(100vh-56px)] w-75 sm:w-85">
                      <DashboardSidebar
                        collapsed={false}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">Dashboard</span>
                  <span className="text-xs text-muted-foreground">
                    Welcome back
                  </span>
                </div>
              </div>

              {/* Desktop header placeholder */}
              <div className="hidden md:block">
                <span className="text-sm font-semibold">Dashboard</span>
              </div>

              {/* Right side actions placeholder */}
              <div className="flex items-center gap-2">{/* actions */}</div>
            </div>
            <Separator />
          </div>

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
