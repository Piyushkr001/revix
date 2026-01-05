"use client";

import * as React from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import {
  Clock,
  Search,
  RefreshCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type HistoryRow = {
  id: string;
  productName: string;
  source: string | null;
  score10: number;
  sentiment: "positive" | "neutral" | "negative";
  reviewCount?: number | null;
  createdAt: string;
};

type HistoryListResponse = {
  items: HistoryRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

const api = axios.create({ baseURL: "" });

function sentimentVariant(s: HistoryRow["sentiment"]) {
  if (s === "positive") return "default";
  if (s === "negative") return "destructive";
  return "secondary";
}

function scoreBadge(score: number) {
  if (score >= 8) return "default";
  if (score <= 4) return "destructive";
  return "secondary";
}

export default function HistoryPage() {
  const { isLoaded, isSignedIn } = useAuth();

  const [q, setQ] = React.useState("");
  const [sentiment, setSentiment] = React.useState<"all" | HistoryRow["sentiment"]>("all");
  const [sort, setSort] = React.useState<"newest" | "oldest" | "score_high" | "score_low">("newest");
  const [minScore, setMinScore] = React.useState("1");
  const [maxScore, setMaxScore] = React.useState("10");

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [data, setData] = React.useState<HistoryListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detail, setDetail] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        q: q.trim() || undefined,
        sentiment,
        sort,
        minScore,
        maxScore,
        page,
        pageSize,
      };

      const res = await api.get<HistoryListResponse>("/api/history", { params });
      setData(res.data);
    } catch (e: any) {
      setData({ items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } });
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, q, sentiment, sort, minScore, maxScore, page, pageSize]);

  React.useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      setData({ items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } });
      return;
    }

    load();
  }, [isLoaded, isSignedIn, load, pageSize]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [q, sentiment, sort, minScore, maxScore]);

  async function openDetail(id: string) {
    // ✅ Guard: don't call API before Clerk is ready
    if (!isLoaded || !isSignedIn) return;

    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);

    try {
      const res = await api.get(`/api/history/${id}`);

      // If API returns `{ item: ... }`
      setDetail(res.data?.item ?? res.data);
    } catch (e: any) {
      const status = e?.response?.status;
      const payload = e?.response?.data;

      // ✅ Make the failure obvious (Next.js route 404 vs API not found)
      setDetail({
        error: "Failed to load detail",
        status,
        payload,
        hint:
          status === 404
            ? "404 means /api/history/[id] route is missing OR wrong folder (app/api vs src/app/api)."
            : status === 401
            ? "401 means Clerk session not recognized for this API route."
            : "Check server logs and API route implementation.",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function copyJSON(row: HistoryRow) {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2)).catch(() => {});
  }

  const pagination = data?.pagination;

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="shadow-sm dark:shadow-black/20">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>Sign in to view your analysis history.</CardDescription>
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
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your saved analyses with scores, sentiment, and metadata.
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

      <Card className="shadow-sm dark:shadow-black/20">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Past analyses
              </CardTitle>
              <CardDescription>Search and filter results. Click “View” to see details.</CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search product name or source..."
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={sentiment} onValueChange={(v) => setSentiment(v as any)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                <SelectTrigger className="w-full sm:w-45">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="score_high">Score (High → Low)</SelectItem>
                  <SelectItem value="score_low">Score (Low → High)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Input
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  inputMode="numeric"
                  className="w-22.5"
                  placeholder="Min"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  inputMode="numeric"
                  className="w-22.5"
                  placeholder="Max"
                />
              </div>

              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-full sm:w-35">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={load} className="w-full sm:w-auto">
                Apply
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-4 sm:p-6">
          {/* Content */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="mt-2 h-3 w-40" />
                </div>
              ))}
            </div>
          ) : !data?.items?.length ? (
            <div className="flex flex-col items-start gap-2 rounded-lg border border-border/60 bg-background p-6">
              <p className="text-sm font-medium">No history found</p>
              <p className="text-sm text-muted-foreground">
                Run analyses from the Analyse page and they’ll appear here.
              </p>
              <Button asChild className="mt-2">
                <a href="/dashboard/analyse">Go to Analyse</a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.items.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.productName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.source ?? "Unknown source"} • {new Date(row.createdAt).toLocaleString()}
                      {row.reviewCount != null ? ` • Reviews: ${row.reviewCount}` : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={scoreBadge(row.score10)}>Score: {row.score10}/10</Badge>
                      <Badge variant={sentimentVariant(row.sentiment)}>{row.sentiment}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      variant="outline"
                      onClick={() => copyJSON(row)}
                      className="w-full sm:w-auto"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy JSON
                    </Button>

                    <Button
                      onClick={() => openDetail(row.id)}
                      className="w-full sm:w-auto"
                      disabled={!isLoaded || !isSignedIn}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} • Total {pagination.total}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Detail dialog (accessible: includes DialogTitle) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Analysis details</DialogTitle>
            <DialogDescription>Full record snapshot from your history.</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border/60 bg-muted p-3 text-xs">
              {JSON.stringify(detail, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
