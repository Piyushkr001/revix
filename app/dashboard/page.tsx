"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Activity,
  BarChart3,
  Clock3,
  RefreshCcw,
  Search,
  TrendingUp,
  FileText,
  AlertTriangle,
  Inbox,
  LogIn,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardSummary = {
  hasData: boolean;
  updatedAt: string; // ISO
  stats?: {
    totalAnalyses: number;
    avgScore: number; // 1..10
    positiveRate: number; // 0..100
    activeProducts: number;
  };
  recent?: {
    id: string;
    productName: string;
    score10: number;
    sentiment: "positive" | "neutral" | "negative";
    createdAt: string;
  }[];
  alerts?: { id: string; label: string; severity: "low" | "medium" | "high" }[];
};

const api = axios.create({ baseURL: "", withCredentials: true });

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function sentimentBadgeVariant(
  s: NonNullable<DashboardSummary["recent"]>[number]["sentiment"]
) {
  switch (s) {
    case "positive":
      return "default";
    case "neutral":
      return "secondary";
    case "negative":
      return "destructive";
  }
}

function clamp10(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

function StatCard({
  title,
  value,
  icon,
  hint,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card className="shadow-sm dark:shadow-black/20">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardDescription className="truncate">{title}</CardDescription>
          <CardTitle className="mt-1 text-2xl">
            {loading ? <Skeleton className="h-7 w-24" /> : value}
          </CardTitle>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="rounded-lg border border-border/60 bg-background p-2">
          {icon}
        </div>
      </CardHeader>
      <CardContent />
    </Card>
  );
}

function EmptyState({
  onAnalyzeClick,
}: {
  onAnalyzeClick?: () => void;
}) {
  return (
    <Card className="shadow-sm dark:shadow-black/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          No realtime data yet
        </CardTitle>
        <CardDescription>
          Start by analyzing your first product reviews. As soon as you create an
          analysis, this dashboard will update automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={onAnalyzeClick} className="w-full sm:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Analyze Reviews
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            View sample report
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background p-4">
            <p className="text-sm font-medium">What you will see here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Score trends, latest analyses, aspect sentiment, and alerts.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background p-4">
            <p className="text-sm font-medium">Realtime refresh</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The dashboard refreshes automatically while you’re signed in.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background p-4">
            <p className="text-sm font-medium">Next step</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect analyses schema + save history for full analytics.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SignedOutState() {
  return (
    <Card className="shadow-sm dark:shadow-black/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Sign in to view your dashboard
        </CardTitle>
        <CardDescription>
          Your dashboard shows realtime insights for your analyses. Please sign
          in to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <a href="/sign-in">Go to Login</a>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <a href="/">Back to Home</a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const [data, setData] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      // ✅ Never call API until Clerk is loaded AND user is signed in
      if (!isLoaded || !isSignedIn) return;

      const silent = !!opts?.silent;

      try {
        if (!silent) setRefreshing(true);
        setError(null);

        const res = await api.get<DashboardSummary>("/api/dashboard/summary");
        setData(res.data);
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401) {
          // If session expires, show signed-out state
          setData(null);
          setError("Session expired. Please sign in again.");
          return;
        }
        setError(e?.response?.data?.error ?? e?.message ?? "Failed to load dashboard");
        setData(null);
      } finally {
        setLoading(false);
        if (!silent) setRefreshing(false);
      }
    },
    [isLoaded, isSignedIn]
  );

  // Initial load (only when authenticated)
  React.useEffect(() => {
    if (!isLoaded) return;

    // If signed out, stop loading and show signed-out state
    if (!isSignedIn) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    load();
  }, [isLoaded, isSignedIn, load]);

  // Realtime polling (only when authenticated)
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const id = window.setInterval(() => {
      load({ silent: true });
    }, 5000);

    return () => window.clearInterval(id);
  }, [isLoaded, isSignedIn, load]);

  // If Clerk not loaded yet -> skeleton
  if (!isLoaded) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-24" /></CardHeader><CardContent /></Card>
          <Card><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-24" /></CardHeader><CardContent /></Card>
          <Card><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-24" /></CardHeader><CardContent /></Card>
          <Card><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-24" /></CardHeader><CardContent /></Card>
        </div>
      </div>
    );
  }

  // If signed out -> show signed-out state (no API calls)
  if (!isSignedIn) {
    return <SignedOutState />;
  }

  const hasData = !!data?.hasData;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live overview of your latest analyses and score insights.
          </p>

          {data?.updatedAt ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                Updated: {formatTime(data.updatedAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                Realtime: polling every 5s
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => load()}
            disabled={refreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button
            className="w-full sm:w-auto"
            onClick={() => router.push("/dashboard/analyze")}
          >
            <Search className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="min-w-0">
            <p className="font-medium text-destructive">Dashboard error</p>
            <p className="mt-1 text-destructive/90">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Empty State */}
      {!loading && !error && !hasData ? (
        <EmptyState onAnalyzeClick={() => router.push("/dashboard/analyze")} />
      ) : null}

      {/* Content */}
      {hasData ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total analyses"
              value={String(data?.stats?.totalAnalyses ?? 0)}
              hint="All time"
              loading={loading}
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              title="Average score"
              value={`${clamp10(data?.stats?.avgScore ?? 0).toFixed(1)}/10`}
              hint="Across latest analyses"
              loading={loading}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Positive rate"
              value={`${Math.round(data?.stats?.positiveRate ?? 0)}%`}
              hint="Positive sentiment"
              loading={loading}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              title="Active products"
              value={String(data?.stats?.activeProducts ?? 0)}
              hint="Products analyzed"
              loading={loading}
              icon={<Search className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-sm dark:shadow-black/20">
              <CardHeader>
                <CardTitle>Recent analyses</CardTitle>
                <CardDescription>Latest results, refreshed in realtime.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {(data?.recent ?? []).map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border border-border/60 bg-background p-4",
                        "sm:flex-row sm:items-center sm:justify-between"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{r.productName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTime(r.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={sentimentBadgeVariant(r.sentiment)}>
                          {r.sentiment}
                        </Badge>
                        <div className="rounded-md border border-border/60 bg-muted px-3 py-1 text-sm font-semibold">
                          {clamp10(r.score10).toFixed(1)}/10
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!data?.recent || data.recent.length === 0) ? (
                    <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                      No recent analyses found.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:shadow-black/20">
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>Quality issues & sentiment drops.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {(data?.alerts ?? []).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2"
                    >
                      <p className="min-w-0 truncate text-sm">{a.label}</p>
                      <Badge
                        variant={
                          a.severity === "high"
                            ? "destructive"
                            : a.severity === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {a.severity}
                      </Badge>
                    </div>
                  ))}

                  {(!data?.alerts || data.alerts.length === 0) ? (
                    <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                      No alerts right now.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Loading fallback (signed in) */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-24" /></CardHeader><CardContent /></Card>
          <Card><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-24" /></CardHeader><CardContent /></Card>
          <Card><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-24" /></CardHeader><CardContent /></Card>
          <Card><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-7 w-24" /></CardHeader><CardContent /></Card>
        </div>
      ) : null}
    </div>
  );
}
