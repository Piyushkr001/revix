"use client";

import * as React from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import {
  BarChart3,
  Download,
  RefreshCcw,
  CalendarDays,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Report = {
  id: string;
  title: string;
  preset: "7d" | "30d" | "90d" | "all" | "custom";
  dateFrom: string | null;
  dateTo: string | null;
  kpis: {
    totalAnalyses: number;
    avgScore10: number | null;
    bestScore10: number | null;
    worstScore10: number | null;
    lastActivityAt: string | null;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topProducts: Array<{
    productName: string;
    count: number;
    avgScore10: number | null;
    sentimentMode: "positive" | "neutral" | "negative";
  }>;
  createdAt: string;
};

const api = axios.create({ baseURL: "" });

function presetLabel(p: Report["preset"]) {
  if (p === "7d") return "Last 7 days";
  if (p === "30d") return "Last 30 days";
  if (p === "90d") return "Last 90 days";
  if (p === "all") return "All time";
  return "Custom";
}

function sentimentVariant(s: "positive" | "neutral" | "negative") {
  if (s === "positive") return "default";
  if (s === "negative") return "destructive";
  return "secondary";
}

export default function ReportsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  const [reports, setReports] = React.useState<Report[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [preset, setPreset] = React.useState<Report["preset"]>("30d");
  const [title, setTitle] = React.useState("");

  const [selected, setSelected] = React.useState<Report | null>(null);

  const load = React.useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      setError(null);
      setLoading(true);
      const { data } = await api.get<{ reports: Report[] }>("/api/reports");
      setReports(data.reports);
      setSelected(data.reports?.[0] ?? null);
    } catch (e: any) {
      setReports([]);
      setSelected(null);
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setReports([]);
      setSelected(null);
      return;
    }
    load();
  }, [isLoaded, isSignedIn, load]);

  async function generate() {
    if (!isLoaded || !isSignedIn) return;

    try {
      setGenerating(true);
      setError(null);

      const payload = {
        preset,
        title: title.trim() || undefined,
      };

      const { data } = await api.post<{ report: Report }>("/api/reports/generate", payload);

      // Reload list and select newly created report
      await load();
      setSelected(data.report);
      setTitle("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message ?? "Generate failed");
    } finally {
      setGenerating(false);
    }
  }

  function downloadJSON(r: Report) {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${r.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
          <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="shadow-sm dark:shadow-black/20">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>Sign in to generate and view reports.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
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

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate report snapshots for trends, sentiment breakdown, and top products.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={load} className="w-full sm:w-auto">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="min-w-0">
            <p className="font-medium text-destructive">Error</p>
            <p className="mt-1 text-destructive/90">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Generate + List */}
        <Card className="shadow-sm dark:shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Generate report
            </CardTitle>
            <CardDescription>Create a snapshot you can download and compare.</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div>
              <Label>Preset</Label>
              <Select value={preset} onValueChange={(v) => setPreset(v as any)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <div className="mt-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., January performance report"
                />
              </div>
            </div>

            <Button onClick={generate} disabled={generating} className="w-full">
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>

            <Separator />

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Saved reports</p>

              {loading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !reports?.length ? (
                <div className="rounded-lg border border-border/60 bg-background p-3 text-sm text-muted-foreground">
                  No reports yet. Generate your first report.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {reports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left transition",
                        "border-border/60 bg-background hover:bg-accent/40",
                        selected?.id === r.id && "bg-accent/60"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {presetLabel(r.preset)} • {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-md border border-border/60 bg-muted px-2 py-1 text-xs font-semibold">
                        {r.kpis.totalAnalyses}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Detail */}
        <Card className="shadow-sm dark:shadow-black/20 lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="truncate">{selected?.title ?? "Report details"}</CardTitle>
              <CardDescription>
                {selected
                  ? `${presetLabel(selected.preset)} • Created ${new Date(selected.createdAt).toLocaleString()}`
                  : "Select a report to view KPI breakdown and top products."}
              </CardDescription>
            </div>

            {selected ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => downloadJSON(selected)} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              </div>
            ) : null}
          </CardHeader>

          <CardContent>
            {!selected ? (
              <div className="rounded-lg border border-border/60 bg-background p-6 text-sm text-muted-foreground">
                No report selected.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* KPI cards */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 rounded-lg border border-border/60 bg-background p-4">
                    <p className="text-xs text-muted-foreground">Total analyses</p>
                    <p className="mt-1 text-2xl font-semibold">{selected.kpis.totalAnalyses}</p>
                  </div>

                  <div className="flex-1 rounded-lg border border-border/60 bg-background p-4">
                    <p className="text-xs text-muted-foreground">Average score</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {selected.kpis.avgScore10 ?? "—"}
                      {selected.kpis.avgScore10 != null ? "/10" : ""}
                    </p>
                  </div>

                  <div className="flex-1 rounded-lg border border-border/60 bg-background p-4">
                    <p className="text-xs text-muted-foreground">Best / Worst</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {(selected.kpis.bestScore10 ?? "—") + " / " + (selected.kpis.worstScore10 ?? "—")}
                    </p>
                  </div>
                </div>

                {/* Sentiment */}
                <div className="rounded-lg border border-border/60 bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Sentiment distribution</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Positive / Neutral / Negative counts
                      </p>
                    </div>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <Separator className="my-3" />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">positive: {selected.sentiment.positive}</Badge>
                      <Badge variant="secondary">neutral: {selected.sentiment.neutral}</Badge>
                      <Badge variant="destructive">negative: {selected.sentiment.negative}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last activity: {selected.kpis.lastActivityAt ? new Date(selected.kpis.lastActivityAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>

                {/* Top products */}
                <div className="rounded-lg border border-border/60 bg-background p-4">
                  <p className="text-sm font-semibold">Top products</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Products with most analyses in this report.
                  </p>

                  <Separator className="my-3" />

                  {!selected.topProducts?.length ? (
                    <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                      No product data in this report.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selected.topProducts.map((p) => (
                        <div
                          key={p.productName}
                          className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.productName}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Analyses: {p.count} • Avg score: {p.avgScore10 ?? "—"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <Badge variant={sentimentVariant(p.sentimentMode)}>{p.sentimentMode}</Badge>
                            <div className="rounded-md border border-border/60 bg-muted px-2 py-1 text-xs font-semibold">
                              {p.avgScore10 ?? "—"}/10
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
