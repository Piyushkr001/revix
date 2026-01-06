"use client";

import * as React from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import {
  LifeBuoy,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Clock,
  Tag,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  message: string;
  createdAt: string;
};

type TicketListResponse = { tickets: Ticket[] };

const api = axios.create({ baseURL: "" });

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "technical", label: "Technical" },
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "feedback", label: "Feedback" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

function badgeForStatus(status: Ticket["status"]) {
  switch (status) {
    case "open":
      return <Badge variant="secondary">Open</Badge>;
    case "in_progress":
      return <Badge>In progress</Badge>;
    case "resolved":
      return <Badge variant="outline">Resolved</Badge>;
    case "closed":
      return <Badge variant="destructive">Closed</Badge>;
  }
}

function badgeForPriority(priority: Ticket["priority"]) {
  switch (priority) {
    case "low":
      return <Badge variant="outline">Low</Badge>;
    case "medium":
      return <Badge variant="secondary">Medium</Badge>;
    case "high":
      return <Badge>High</Badge>;
    case "urgent":
      return <Badge variant="destructive">Urgent</Badge>;
  }
}

export default function SupportPage() {
  const { isLoaded, isSignedIn } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [open, setOpen] = React.useState(false);

  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [category, setCategory] = React.useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("general");
  const [priority, setPriority] = React.useState<(typeof PRIORITY_OPTIONS)[number]["value"]>("medium");

  const load = React.useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<TicketListResponse>("/api/support");
      setTickets(data.tickets ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function createTicket() {
    try {
      setCreating(true);
      setError(null);
      setOk(null);

      const payload = {
        subject,
        message,
        category,
        priority,
        meta: {
          page: "/dashboard/support",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      };

      const { data } = await api.post<{ ticket: Ticket }>("/api/support", payload);
      setTickets((prev) => [data.ticket, ...prev]);

      setOk("Support ticket submitted.");
      setTimeout(() => setOk(null), 2000);

      setSubject("");
      setMessage("");
      setCategory("general");
      setPriority("medium");
      setOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to submit ticket");
    } finally {
      setCreating(false);
    }
  }

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
          <CardDescription>Sign in to create and track your support tickets.</CardDescription>
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
          <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a ticket, track status, and get help with product analysis features.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={load} className="w-full sm:w-auto">
            Reload
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New ticket
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create a support ticket</DialogTitle>
                <DialogDescription>
                  Share the issue details. If it’s a bug, include steps to reproduce.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Score seems wrong for Amazon reviews"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain the issue, steps to reproduce, expected vs actual result..."
                    className="min-h-30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Include product URL, source (Amazon/Flipkart/manual), and sample review text if possible.
                  </p>
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  onClick={createTicket}
                  disabled={creating || subject.trim().length < 3 || message.trim().length < 10}
                  className="w-full sm:w-auto"
                >
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LifeBuoy className="mr-2 h-4 w-4" />}
                  Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts */}
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="min-w-0">
            <p className="font-medium text-destructive">Error</p>
            <p className="mt-1 text-destructive/90">{error}</p>
          </div>
        </div>
      ) : null}

      {ok ? (
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5" />
          <div className="min-w-0">{ok}</div>
        </div>
      ) : null}

      {/* Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Ticket list */}
        <div className="flex flex-1 flex-col gap-4">
          <Card className="shadow-sm dark:shadow-black/20">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>Your tickets</CardTitle>
              <CardDescription>Latest 50 tickets (most recent first).</CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No tickets yet. Create one to get support.
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.subject}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" /> {t.category}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />{" "}
                            {new Date(t.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {badgeForPriority(t.priority)}
                        {badgeForStatus(t.status)}
                      </div>
                    </div>

                    <p className="line-clamp-3 text-sm text-muted-foreground">{t.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Help + quick contact */}
        <div className="flex w-full flex-col gap-6 lg:w-105">
          <Card className="shadow-sm dark:shadow-black/20">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>Quick help</CardTitle>
              <CardDescription>Common fixes before raising a ticket.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-4 p-4 sm:p-6 text-sm">
              <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
                <li>Check that you are signed in with the correct account.</li>
                <li>Reload the page and re-run the analysis.</li>
                <li>If scraping is involved, confirm the product URL is valid and accessible.</li>
                <li>For scoring issues, share sample reviews and expected score range.</li>
              </ul>

              <div className="rounded-lg border border-border/60 bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  If you want, we can add an admin view to manage ticket status and responses.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm dark:shadow-black/20">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact
              </CardTitle>
              <CardDescription>Prefer email? Use tickets for fastest tracking.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-3 p-4 sm:p-6 text-sm">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-muted-foreground">
                  Email support is optional. If you enable Nodemailer, new tickets can also email the admin.
                </p>
              </div>
              <Button variant="outline" asChild className="w-full">
                <a href="/dashboard/support">Open tickets</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
