import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { productAnalyses } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isoOrNull(v: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function unauthorizedDebug(req: Request, extra?: Record<string, unknown>) {
  const cookie = req.headers.get("cookie") ?? "";
  return {
    cookiePresent: cookie.length > 0,
    cookiePreview: cookie.slice(0, 160),
    ...extra,
  };
}

export async function GET(req: Request) {
  try {
    // ✅ auth() is synchronous
    const a = auth();
    const userId = (await a).userId ?? null;
    const sessionId = (await a).sessionId ?? null;

    // Optional token presence check (guarded)
    let tokenPresent: boolean | null = null;
    try {
      const maybeGetToken = (a as any)?.getToken;
      if (typeof maybeGetToken === "function") {
        const t = await maybeGetToken();
        tokenPresent = !!t;
      } else {
        tokenPresent = null;
      }
    } catch {
      tokenPresent = false;
    }

    // Optional currentUser debug (guarded)
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
          debug: unauthorizedDebug(req, {
            userId,
            sessionId,
            tokenPresent,
            currentUser: cu ? { id: cu.id } : null,
          }),
          hint:
            "If cookiePresent=false => browser not sending Clerk cookies. If cookiePresent=true but userId=null => middleware not applied or session not established.",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const since = isoOrNull(url.searchParams.get("since")); // optional incremental updates
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 10) || 10, 50);

    // --- 1) Recent analyses (optionally incremental) ---
    const recent = await db
      .select({
        id: productAnalyses.id,
        productName: productAnalyses.productName,
        source: productAnalyses.source,
        score10: productAnalyses.score10,
        sentiment: productAnalyses.sentiment,
        summary: productAnalyses.summary,
        keywords: productAnalyses.keywords,
        createdAt: productAnalyses.createdAt,
      })
      .from(productAnalyses)
      .where(
        since
          ? sql`${productAnalyses.userId} = ${userId} AND ${productAnalyses.createdAt} >= ${new Date(
              since
            )}`
          : eq(productAnalyses.userId, userId)
      )
      .orderBy(desc(productAnalyses.createdAt))
      .limit(limit);

    // --- 2) Aggregates (for “dashboard cards”) ---
    // avg score + totals. Drizzle returns strings for numeric avg in some drivers -> coerce.
    const aggregates = await db
      .select({
        total: sql<number>`count(*)`,
        avgScore: sql<number>`avg(${productAnalyses.score10})`,
        maxScore: sql<number>`max(${productAnalyses.score10})`,
        minScore: sql<number>`min(${productAnalyses.score10})`,
        lastCreatedAt: sql<Date | null>`max(${productAnalyses.createdAt})`,
      })
      .from(productAnalyses)
      .where(eq(productAnalyses.userId, userId));

    const agg = aggregates[0];

    const total = Number(agg?.total ?? 0);
    const avgScore = agg?.avgScore == null ? null : Number(agg.avgScore);
    const maxScore = agg?.maxScore == null ? null : Number(agg.maxScore);
    const minScore = agg?.minScore == null ? null : Number(agg.minScore);

    // Empty-state decision
    const hasData = total > 0;

    // “Realtime” server timestamp for polling clients
    const serverTime = new Date().toISOString();

    return NextResponse.json(
      {
        hasData,
        serverTime, // client can show “Last updated”
        sinceUsed: since, // helpful for debugging
        stats: {
          totalAnalyses: total,
          avgScore10: hasData ? Number(avgScore?.toFixed(2)) : null,
          bestScore10: hasData ? maxScore : null,
          worstScore10: hasData ? minScore : null,
          lastActivityAt: agg?.lastCreatedAt ? new Date(agg.lastCreatedAt).toISOString() : null,
        },
        recentAnalyses: recent.map((r) => ({
          ...r,
          createdAt: new Date(r.createdAt).toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: err?.message ?? "Unknown error",
        name: err?.name ?? null,
      },
      { status: 500 }
    );
  }
}
