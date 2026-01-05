"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Search,
  FileText,
  History,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const navMain: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Analyze Reviews", href: "/dashboard/analyze", icon: Search },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  { title: "History", href: "/dashboard/history", icon: History },
  { title: "Insights", href: "/dashboard/insights", icon: BarChart3 },
];

const navSecondary: NavItem[] = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Support", href: "/dashboard/support", icon: HelpCircle },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void; // useful for closing mobile sheet on click
}) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "h-full w-full",
          "flex flex-col",
          "border-r border-border/60",
          "bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2",
              "hover:bg-accent/60 transition-colors"
            )}
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-background shadow-sm">
              <span className="text-sm font-bold">R</span>
            </div>

            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">Revix</span>
                <span className="text-xs text-muted-foreground">
                  Dashboard
                </span>
              </div>
            )}
          </Link>

          {/* Collapse button (desktop) */}
          {onToggleCollapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          ) : null}
        </div>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-1">
            {navMain.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    "transition-colors",
                    active
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-foreground/80 hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  {!collapsed && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}

                  {!collapsed && item.badge ? (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );

              if (!collapsed) return link;

              // Collapsed: show tooltip on hover
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            {navSecondary.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    "transition-colors",
                    active
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-foreground/80 hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}
                </Link>
              );

              if (!collapsed) return link;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-3">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start gap-2",
              collapsed && "justify-center"
            )}
            onClick={() => {
              // Hook this to Clerk signOut() if you want:
              // signOut({ redirectUrl: "/" })
              console.log("logout clicked");
            }}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </Button>

          {!collapsed && (
            <p className="mt-2 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Revix
            </p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
