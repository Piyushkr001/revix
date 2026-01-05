"use client";

import * as React from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import {
  BarChart3,
  RefreshCcw,
  TrendingUp,
  Gauge,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

type TrendPoint = { day: string; count: number; avgScore: number | null };

type InsightsResponse = {
  hasData: boolean;
  updatedAt: string;

  totals: {
    totalAnalyses: number;
    totalReviews: number;
    avgScore: number | null;
    bestScore: number | null;
    worstScore: number | null;
  };

  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };

  buckets: {
    low_1_3: number;
    mid_4_6: number;
    good_7_8: number;
    great_9_10: number;
  };

  topSources: { source: string; count: number; avgScore: number | null }[];
  topProducts: { productName: string; count: number; avgScore: number | null }[];

  trend14d: TrendPoint[];
};

const api = axios.create({
  baseURL: "",
  withCredentials: true, // important if you rely on cookies
});

function toPct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function scoreTone(score: number | null) {
  if (score == null) return "secondary";
  if (score >= 8) return "default";
  if (score <= 4) return "destructive";
  return "secondary";
}

export default function InsightsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  const [data, setData] = React.useState<InsightsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get<InsightsResponse>("/api/insights");
      setData(res.data);
    } catch (e: any) {
      setData(null);
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  React.useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      setData(null);
      return;
    }

    load();
  }, [isLoaded, isSignedIn, load]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
        <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="shadow-sm dark:shadow-black/20">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>Sign in to view analytics and insights.</CardDescription>
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

  const total = data?.totals.totalAnalyses ?? 0;
  const pos = data?.sentiment.positive ?? 0;
  const neu = data?.sentiment.neutral ?? 0;
  const neg = data?.sentiment.negative ?? 0;

  const posPct = toPct(pos, total);
  const neuPct = toPct(neu, total);
  const negPct = toPct(neg, total);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Summary analytics across your saved analyses: sentiment mix, score trends, and top sources/products.
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

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="shadow-sm dark:shadow-black/20">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data?.hasData ? (
        /* Empty state */
        <Card className="shadow-sm dark:shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              No insights yet
            </CardTitle>
            <CardDescription>
              Run your first product review analysis. Once you save results, this page will show trends and aggregates.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <a href="/dashboard/analyse">Go to Analyse</a>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href="/dashboard/history">View History</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="shadow-sm dark:shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Total analyses
                </CardTitle>
                <CardDescription>Saved records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{data.totals.totalAnalyses}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {new Date(data.updatedAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-4 w-4" />
                  Average score
                </CardTitle>
                <CardDescription>Across all analyses</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="text-3xl font-semibold">
                  {data.totals.avgScore == null ? "—" : data.totals.avgScore.toFixed(1)}
                </div>
                <Badge variant={scoreTone(data.totals.avgScore)}>
                  / 10
                </Badge>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Best / Worst</CardTitle>
                <CardDescription>Range</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Best</span>
                  <span className="text-xl font-semibold">
                    {data.totals.bestScore ?? "—"}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted-foreground">Worst</span>
                  <span className="text-xl font-semibold">
                    {data.totals.worstScore ?? "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reviews processed</CardTitle>
                <CardDescription>Sum of reviewCount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{data.totals.totalReviews}</div>
              </CardContent>
            </Card>
          </div>

          {/* Sentiment + Buckets */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm dark:shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5" />
                  Sentiment distribution
                </CardTitle>
                <CardDescription>Positive / Neutral / Negative mix</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="default">Positive</Badge>
                      <span className="text-muted-foreground">{pos} ({posPct}%)</span>
                    </span>
                  </div>
                  <Progress value={posPct} />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">Neutral</Badge>
                      <span className="text-muted-foreground">{neu} ({neuPct}%)</span>
                    </span>
                  </div>
                  <Progress value={neuPct} />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="destructive">Negative</Badge>
                      <span className="text-muted-foreground">{neg} ({negPct}%)</span>
                    </span>
                  </div>
                  <Progress value={negPct} />
                </div>

                <Separator />

                <p className="text-xs text-muted-foreground">
                  Tip: If negative spikes, check sources/products with low scores under “Top products” and “Top sources”.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Meh className="h-5 w-5" />
                  Score buckets
                </CardTitle>
                <CardDescription>How your analyses are distributed by score</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {[
                  { label: "1–3 (Low)", value: data.buckets.low_1_3 },
                  { label: "4–6 (Mid)", value: data.buckets.mid_4_6 },
                  { label: "7–8 (Good)", value: data.buckets.good_7_8 },
                  { label: "9–10 (Great)", value: data.buckets.great_9_10 },
                ].map((b) => {
                  const pct = toPct(b.value, total);
                  return (
                    <div key={b.label} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{b.label}</span>
                        <span className="text-muted-foreground">
                          {b.value} ({pct}%)
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Trend + Top lists */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm dark:shadow-black/20">
              <CardHeader>
                <CardTitle>14-day trend</CardTitle>
                <CardDescription>Daily volume and average score</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {data.trend14d?.length ? (
                  <div className="flex flex-col gap-2">
                    {data.trend14d.map((p) => (
                      <div
                        key={p.day}
                        className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{p.day}</p>
                          <p className="text-xs text-muted-foreground">
                            Analyses: {p.count}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={scoreTone(p.avgScore)}>
                            Avg: {p.avgScore == null ? "—" : p.avgScore.toFixed(1)}/10
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/60 p-6 text-sm text-muted-foreground">
                    No trend data yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="shadow-sm dark:shadow-black/20">
                <CardHeader>
                  <CardTitle>Top sources</CardTitle>
                  <CardDescription>Most frequent sources by saved analyses</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.topSources?.length ? (
                    data.topSources.map((s) => (
                      <div
                        key={s.source}
                        className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="truncate text-sm font-medium">{s.source}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Count: {s.count}</Badge>
                          <Badge variant={scoreTone(s.avgScore)}>
                            Avg: {s.avgScore == null ? "—" : s.avgScore.toFixed(1)}/10
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-border/60 p-6 text-sm text-muted-foreground">
                      No sources yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm dark:shadow-black/20">
                <CardHeader>
                  <CardTitle>Top products</CardTitle>
                  <CardDescription>Most frequent products by saved analyses</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.topProducts?.length ? (
                    data.topProducts.map((p, idx) => (
                      <div
                        key={`${p.productName}-${idx}`}
                        className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="truncate text-sm font-medium">{p.productName}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Count: {p.count}</Badge>
                          <Badge variant={scoreTone(p.avgScore)}>
                            Avg: {p.avgScore == null ? "—" : p.avgScore.toFixed(1)}/10
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-border/60 p-6 text-sm text-muted-foreground">
                      No products yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
