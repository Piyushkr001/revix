"use client";

import * as React from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import {
  Settings,
  User2,
  Bell,
  ShieldAlert,
  Save,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

type Prefs = {
  emailProductInsights: boolean;
  emailWeeklyDigest: boolean;
  emailSecurityAlerts: boolean;
  defaultSource: "amazon" | "flipkart" | "manual" | "other";
  autoSaveAnalyses: boolean;
};

type SettingsResponse = {
  user?: { id: string; email?: string; name?: string | null };
  prefs: Prefs;
};

const api = axios.create({ baseURL: "" });

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  const [userPreview, setUserPreview] = React.useState<{ name?: string | null; email?: string } | null>(null);

  const [prefs, setPrefs] = React.useState<Prefs>({
    emailProductInsights: true,
    emailWeeklyDigest: false,
    emailSecurityAlerts: true,
    defaultSource: "manual",
    autoSaveAnalyses: true,
  });

  const [dangerOpen, setDangerOpen] = React.useState(false);
  const [dangerLoading, setDangerLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data } = await api.get<SettingsResponse>("/api/settings");
      setPrefs(data.prefs);
      setUserPreview({
        name: data.user?.name ?? null,
        email: data.user?.email,
      });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function save() {
    try {
      setSaving(true);
      setError(null);
      setOkMsg(null);

      const { data } = await api.put<{ prefs: Prefs }>("/api/settings", prefs);
      setPrefs(data.prefs);
      setOkMsg("Settings saved.");
      setTimeout(() => setOkMsg(null), 2000);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateAccount() {
    try {
      setDangerLoading(true);
      setError(null);

      await api.post("/api/settings/delete-account");
      setDangerOpen(false);

      // Optional: after deactivation, you can redirect or show a message.
      setOkMsg("Account deactivated in database.");
      setTimeout(() => setOkMsg(null), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to deactivate account");
    } finally {
      setDangerLoading(false);
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
          <CardDescription>Sign in to manage your dashboard settings.</CardDescription>
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
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your preferences, notifications, and security options.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={load} className="w-full sm:w-auto">
            Reload
          </Button>
          <Button onClick={save} disabled={saving || loading} className="w-full sm:w-auto">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
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

      {okMsg ? (
        <div className="rounded-lg border border-border/60 bg-background p-4 text-sm">
          {okMsg}
        </div>
      ) : null}

      {/* Grid */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left column */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Profile preview */}
          <Card className="shadow-sm dark:shadow-black/20">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <User2 className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Basic account info (from your database).</CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Label className="w-full text-sm sm:w-32">Name</Label>
                    <Input value={userPreview?.name ?? ""} readOnly />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Label className="w-full text-sm sm:w-32">Email</Label>
                    <Input value={userPreview?.email ?? ""} readOnly />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    To change name/email, update it in Clerk (Profile button) and refresh here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="shadow-sm dark:shadow-black/20">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>Customize your default behaviour across the app.</CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-5 p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Auto-save analyses</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically store results in History after running an analysis.
                      </p>
                    </div>
                    <Switch
                      checked={prefs.autoSaveAnalyses}
                      onCheckedChange={(v: any) => setPrefs((p) => ({ ...p, autoSaveAnalyses: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">Default review source</Label>
                    <Select
                      value={prefs.defaultSource}
                      onValueChange={(v) => setPrefs((p) => ({ ...p, defaultSource: v as any }))}
                    >
                      <SelectTrigger className="w-full sm:w-72">
                        <SelectValue placeholder="Select default source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="amazon">Amazon</SelectItem>
                        <SelectItem value="flipkart">Flipkart</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used as the default on Analyse page.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex w-full flex-col gap-6 lg:w-105">
          {/* Notifications */}
          <Card className="shadow-sm dark:shadow-black/20">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Control what you receive via email.</CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-5 p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Product insights</p>
                      <p className="text-xs text-muted-foreground">Insights after analyses you run.</p>
                    </div>
                    <Switch
                      checked={prefs.emailProductInsights}
                      onCheckedChange={(v: any) => setPrefs((p) => ({ ...p, emailProductInsights: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Weekly digest</p>
                      <p className="text-xs text-muted-foreground">Summary of your recent activity.</p>
                    </div>
                    <Switch
                      checked={prefs.emailWeeklyDigest}
                      onCheckedChange={(v: any) => setPrefs((p) => ({ ...p, emailWeeklyDigest: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Security alerts</p>
                      <p className="text-xs text-muted-foreground">Important security notifications.</p>
                    </div>
                    <Switch
                      checked={prefs.emailSecurityAlerts}
                      onCheckedChange={(v: any) => setPrefs((p) => ({ ...p, emailSecurityAlerts: v }))}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/30 shadow-sm dark:shadow-black/20">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                Danger zone
              </CardTitle>
              <CardDescription>Irreversible actions.</CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
              <Dialog open={dangerOpen} onOpenChange={setDangerOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Deactivate account
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Deactivate account?</DialogTitle>
                    <DialogDescription>
                      This will mark your account as inactive in the database. Your Clerk account is not deleted.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="rounded-lg border border-border/60 bg-muted p-3 text-sm">
                    If you want to fully delete the Clerk account, we can add a server action using Clerk Admin API later.
                  </div>

                  <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => setDangerOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deactivateAccount}
                      disabled={dangerLoading}
                      className="w-full sm:w-auto"
                    >
                      {dangerLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirm deactivate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <p className="text-xs text-muted-foreground">
                Recommended during development. In production, consider a full deletion workflow + export.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom sticky actions (mobile friendly) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button onClick={save} disabled={saving || loading} className="w-full sm:w-auto">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
