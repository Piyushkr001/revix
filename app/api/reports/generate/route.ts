import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";

import { db } from "@/config/db";
import { productAnalyses, reports } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBody = {
  preset: "7d" | "30d" | "90d" | "all" | "custom";
  dateFrom?: string; // ISO
  dateTo?: string;   // ISO
  title?: string;
};

function cookieDebug(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  return {
    cookiePresent: cookie.length > 0,
    cookiePreview: cookie.slice(0, 160),
  };
}

function safeDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function rangeFromPreset(preset: GenerateBody["preset"], dateFrom?: string, dateTo?: string) {
  const now = new Date();

  if (preset === "all") return { from: null as Date | null, to: null as Date | null };

  if (preset === "custom") {
    return { from: safeDate(dateFrom), to: safeDate(dateTo) };
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to: now };
}

function extractDbError(err: any) {
  return {
    message: err?.message ?? "Unknown error",
    name: err?.name ?? null,
    code: err?.code ?? null,
    detail: err?.detail ?? null,
    hint: err?.hint ?? null,
    table: err?.table ?? null,
    column: err?.column ?? null,
    constraint: err?.constraint ?? null,
    routine: err?.routine ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const a = await auth();
    const userId = a.userId ?? null;
    const sessionId = a.sessionId ?? null;

    // Optional currentUser (debug)
    let cu: any = null;
    try {
      cu = await currentUser();
    } catch {
      cu = null;
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          debug: {
            ...cookieDebug(req),
            userId,
            sessionId,
            currentUser: cu ? { id: cu.id } : null,
          },
          hint:
            "If cookiePresent=false => browser not sending Clerk cookies. If cookiePresent=true but userId=null => middleware not applied or session not established.",
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as GenerateBody;
    const preset = body?.preset ?? "30d";
    const { from, to } = rangeFromPreset(preset, body.dateFrom, body.dateTo);

    // Build where clause for analyses in range
    const parts = [eq(productAnalyses.userId, userId)];
    if (from) parts.push(gte(productAnalyses.createdAt, from));
    if (to) parts.push(lte(productAnalyses.createdAt, to));
    const where = and(...parts);

    // KPIs
    const kpiRows = await db
      .select({
        total: sql<number>`count(*)`,
        avgScore: sql<number>`avg(${productAnalyses.score10})`,
        maxScore: sql<number>`max(${productAnalyses.score10})`,
        minScore: sql<number>`min(${productAnalyses.score10})`,
        lastCreatedAt: sql<Date | null>`max(${productAnalyses.createdAt})`,
      })
      .from(productAnalyses)
      .where(where);

    const k = kpiRows[0];
    const total = Number(k?.total ?? 0);
    const avgScore10 = k?.avgScore == null ? null : Number(Number(k.avgScore).toFixed(2));
    const bestScore10 = k?.maxScore == null ? null : Number(k.maxScore);
    const worstScore10 = k?.minScore == null ? null : Number(k.minScore);
    const lastActivityAt = k?.lastCreatedAt ? new Date(k.lastCreatedAt).toISOString() : null;

    // Sentiment distribution
    const sentimentRows = await db
      .select({
        sentiment: productAnalyses.sentiment,
        count: sql<number>`count(*)`,
      })
      .from(productAnalyses)
      .where(where)
      .groupBy(productAnalyses.sentiment);

    const sentiment = { positive: 0, neutral: 0, negative: 0 };
    for (const r of sentimentRows) {
      const c = Number(r.count ?? 0);
      if (r.sentiment === "positive") sentiment.positive = c;
      if (r.sentiment === "neutral") sentiment.neutral = c;
      if (r.sentiment === "negative") sentiment.negative = c;
    }

    // Top products
    const topRows = await db
      .select({
        productName: productAnalyses.productName,
        count: sql<number>`count(*)`,
        avgScore: sql<number>`avg(${productAnalyses.score10})`,
      })
      .from(productAnalyses)
      .where(where)
      .groupBy(productAnalyses.productName)
      .orderBy(desc(sql`count(*)`))
      .limit(8);

    const topProducts = topRows.map((r) => {
      const avg = r.avgScore == null ? null : Number(Number(r.avgScore).toFixed(2));
      const sentimentMode = avg == null ? "neutral" : avg >= 7 ? "positive" : avg <= 4 ? "negative" : "neutral";
      return {
        productName: r.productName,
        count: Number(r.count ?? 0),
        avgScore10: avg,
        sentimentMode,
      };
    });

    const title = body?.title?.trim() || `Report (${preset.toUpperCase()})`;

    // Insert snapshot
    const inserted = await db
      .insert(reports)
      //@ts-ignore
      .values({
        userId,
        title,
        preset,
        dateFrom: from ?? undefined,
        dateTo: to ?? undefined,
        kpis: {
          totalAnalyses: total,
          avgScore10,
          bestScore10,
          worstScore10,
          lastActivityAt,
        },
        sentiment,
        topProducts,
      })
      .returning();

    return NextResponse.json({ report: inserted[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        dbError: extractDbError(err),
        hint:
          "If dbError.code=42P01 => reports table not migrated. If 22P02 => bad UUID/date. If 42703 => column mismatch.",
      },
      { status: 500 }
    );
  }
}
