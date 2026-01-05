"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Sparkles,
  Link as LinkIcon,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  ListChecks,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Analysis = {
  id: string;
  source: "manual" | "amazon" | "flipkart" | "other";
  productName: string;
  productUrl: string | null;
  reviewsText: string;
  score10: number;
  sentiment: "positive" | "neutral" | "negative";
  summary: string | null;
  keywords: string[] | null;
  createdAt: string;
};

const api = axios.create({ baseURL: "" });

function sentimentVariant(s: Analysis["sentiment"]) {
  if (s === "positive") return "default";
  if (s === "negative") return "destructive";
  return "secondary";
}

export default function AnalyzePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const [source, setSource] = React.useState<Analysis["source"]>("manual");
  const [productName, setProductName] = React.useState("");
  const [productUrl, setProductUrl] = React.useState("");
  const [reviewsText, setReviewsText] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [latest, setLatest] = React.useState<Analysis | null>(null);

  const [recent, setRecent] = React.useState<Analysis[] | null>(null);
  const [loadingRecent, setLoadingRecent] = React.useState(true);

  const loadRecent = React.useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      setLoadingRecent(true);
      const { data } = await api.get<{ analyses: Analysis[] }>("/api/analysis");
      setRecent(data.analyses);
    } catch (e: any) {
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [isLoaded, isSignedIn]);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoadingRecent(false);
      setRecent([]);
      return;
    }
    loadRecent();
  }, [isLoaded, isSignedIn, loadRecent]);

  async function onSubmit() {
    if (!isLoaded || !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setError(null);

    if (!productName.trim()) {
      setError("Product name is required.");
      return;
    }
    if (reviewsText.trim().length < 20) {
      setError("Please paste at least 20 characters of reviews.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        source,
        productName: productName.trim(),
        productUrl: productUrl.trim() || undefined,
        reviewsText: reviewsText.trim(),
      };

      const { data } = await api.post<{ analysis: Analysis }>("/api/analysis", payload);
      setLatest(data.analysis);

      // refresh list
      await loadRecent();
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        e?.message ??
        "Failed to analyze reviews";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
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
          <CardDescription>
            Please sign in to analyze reviews and save results to your dashboard.
          </CardDescription>
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
          <h1 className="text-2xl font-semibold tracking-tight">Analyze Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste customer reviews (or a product URL) to generate a 1–10 score and insights.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={loadRecent} className="w-full sm:w-auto">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh history
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto"
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="min-w-0">
            <p className="font-medium text-destructive">Validation error</p>
            <p className="mt-1 text-destructive/90">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Form */}
        <Card className="shadow-sm dark:shadow-black/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              New analysis
            </CardTitle>
            <CardDescription>
              For now, you can paste reviews manually. URL-based scraping can be added later.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Label>Source</Label>
                  <Select value={source} onValueChange={(v: any) => setSource(v as any)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="flipkart">Flipkart</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="productName">Product name</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setProductName(e.target.value)}
                      placeholder="e.g., Boat Rockerz 450"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="productUrl">Product URL (optional)</Label>
                <div className="mt-2 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="productUrl"
                    value={productUrl}
                    onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setProductUrl(e.target.value)}
                    placeholder="https://www.amazon.in/... or https://www.flipkart.com/..."
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  URL scraping is not enabled in this starter; we store it for reference.
                </p>
              </div>

              <div>
                <Label htmlFor="reviewsText">Paste reviews</Label>
                <Textarea
                  id="reviewsText"
                  value={reviewsText}
                  onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setReviewsText(e.target.value)}
                  placeholder="Paste multiple reviews here (one per line recommended)..."
                  className="mt-2 min-h-45"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Tip: Paste at least 3–5 reviews for better stability.</span>
                  <span>{reviewsText.trim().length} chars</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setProductName("");
                    setProductUrl("");
                    setReviewsText("");
                    setLatest(null);
                    setError(null);
                  }}
                  className="w-full sm:w-auto"
                  disabled={submitting}
                >
                  Clear
                </Button>

                <Button onClick={onSubmit} className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result + History */}
        <div className="flex flex-col gap-4">
          {/* Latest result */}
          <Card className="shadow-sm dark:shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Latest result
              </CardTitle>
              <CardDescription>
                Your most recent analysis output.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!latest ? (
                <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                  No analysis yet. Submit reviews to generate a score.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{latest.productName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Source: {latest.source}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={sentimentVariant(latest.sentiment)}>
                        {latest.sentiment}
                      </Badge>
                      <div className="rounded-md border border-border/60 bg-muted px-3 py-1 text-sm font-semibold">
                        {latest.score10}/10
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <p className="text-sm text-foreground/90">
                    {latest.summary ?? "—"}
                  </p>

                  {latest.keywords?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {latest.keywords.map((k) => (
                        <Badge key={k} variant="outline">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent analyses */}
          <Card className="shadow-sm dark:shadow-black/20">
            <CardHeader>
              <CardTitle>Recent analyses</CardTitle>
              <CardDescription>Last 10 saved analyses.</CardDescription>
            </CardHeader>

            <CardContent>
              {loadingRecent ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !recent?.length ? (
                <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                  No history yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recent.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.productName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={sentimentVariant(r.sentiment)} className="hidden sm:inline-flex">
                          {r.sentiment}
                        </Badge>
                        <div className="rounded-md border border-border/60 bg-muted px-2 py-1 text-xs font-semibold">
                          {r.score10}/10
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
