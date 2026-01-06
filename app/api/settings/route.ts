import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "@/config/db";
import { users, notificationPrefs } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Prefs = {
  emailProductInsights: boolean;
  emailWeeklyDigest: boolean;
  emailSecurityAlerts: boolean;
  defaultSource: "amazon" | "flipkart" | "manual" | "other";
  autoSaveAnalyses: boolean;
};

function normalizeDefaultSource(v: unknown): Prefs["defaultSource"] {
  if (v === "amazon" || v === "flipkart" || v === "manual" || v === "other") return v;
  return "manual";
}

function prefsFromRow(row: any): Prefs {
  return {
    emailProductInsights: !!row?.emailProductInsights,
    emailWeeklyDigest: !!row?.emailWeeklyDigest,
    emailSecurityAlerts: !!row?.emailSecurityAlerts,
    defaultSource: normalizeDefaultSource(row?.defaultSource),
    autoSaveAnalyses: !!row?.autoSaveAnalyses,
  };
}

const DEFAULT_PREFS: Prefs = {
  emailProductInsights: true,
  emailWeeklyDigest: false,
  emailSecurityAlerts: true,
  defaultSource: "manual",
  autoSaveAnalyses: true,
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cu = await currentUser();
    if (!cu) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const email =
      cu.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
      cu.emailAddresses?.[0]?.emailAddress ??
      "";

    const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null;
    const imageUrl = cu.imageUrl ?? null;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true, name: true, isActive: true },
    });

    if (!existingUser) {
      await db.insert(users).values({ id: userId, email, name, imageUrl });
    } else {
      const shouldUpdate =
        existingUser.email !== email || (existingUser.name ?? null) !== (name ?? null);

      if (shouldUpdate) {
        await db
          .update(users)
          .set({ email, name, imageUrl, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }
    }

    const prefRow = await db.query.notificationPrefs.findFirst({
      where: eq(notificationPrefs.userId, userId),
    });

    const prefs = prefRow ? prefsFromRow(prefRow) : DEFAULT_PREFS;

    return NextResponse.json({ user: { id: userId, email, name }, prefs }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as Partial<Prefs>;

    const nextPrefs: Prefs = {
      emailProductInsights: body.emailProductInsights ?? DEFAULT_PREFS.emailProductInsights,
      emailWeeklyDigest: body.emailWeeklyDigest ?? DEFAULT_PREFS.emailWeeklyDigest,
      emailSecurityAlerts: body.emailSecurityAlerts ?? DEFAULT_PREFS.emailSecurityAlerts,
      defaultSource: normalizeDefaultSource(body.defaultSource),
      autoSaveAnalyses: body.autoSaveAnalyses ?? DEFAULT_PREFS.autoSaveAnalyses,
    };

    const existing = await db.query.notificationPrefs.findFirst({
      where: eq(notificationPrefs.userId, userId),
      columns: { id: true },
    });

    if (!existing) {
      await db.insert(notificationPrefs).values({
        userId,
        emailProductInsights: nextPrefs.emailProductInsights,
        emailWeeklyDigest: nextPrefs.emailWeeklyDigest,
        emailSecurityAlerts: nextPrefs.emailSecurityAlerts,
        defaultSource: nextPrefs.defaultSource,
        autoSaveAnalyses: nextPrefs.autoSaveAnalyses,
      });
    } else {
      await db
        .update(notificationPrefs)
        .set({
          emailProductInsights: nextPrefs.emailProductInsights,
          emailWeeklyDigest: nextPrefs.emailWeeklyDigest,
          emailSecurityAlerts: nextPrefs.emailSecurityAlerts,
          defaultSource: nextPrefs.defaultSource,
          autoSaveAnalyses: nextPrefs.autoSaveAnalyses,
          updatedAt: new Date(),
        })
        .where(eq(notificationPrefs.userId, userId));
    }

    return NextResponse.json({ prefs: nextPrefs }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
