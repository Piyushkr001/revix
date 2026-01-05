import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { productAnalyses } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SENTIMENTS = ["positive", "neutral", "negative"] as const;

function cookieDebug(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  return {
    cookiePresent: cookie.length > 0,
    cookiePreview: cookie.slice(0, 180),
  };
}

function asInt(v: string | null, def: number) {
  if (!v) return def;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  try {
    const a = await auth();
    const userId = a.userId ?? null;
    const sessionId = a.sessionId ?? null;

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
            "If cookiePresent=false => browser not sending Clerk cookies. If cookiePresent=true but userId=null => middleware not applied OR session not established.",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const sentiment = (url.searchParams.get("sentiment") ?? "all").trim();
    const minScore = clamp(asInt(url.searchParams.get("minScore"), 1), 1, 10);
    const maxScore = clamp(asInt(url.searchParams.get("maxScore"), 10), 1, 10);
    const sort = (url.searchParams.get("sort") ?? "newest").trim();
    const page = clamp(asInt(url.searchParams.get("page"), 1), 1, 999999);
    const pageSize = clamp(asInt(url.searchParams.get("pageSize"), 10), 5, 50);

    const conditions: any[] = [eq(productAnalyses.userId, userId)];

    if (q) {
      conditions.push(
        or(
          ilike(productAnalyses.productName, `%${q}%`),
          ilike(productAnalyses.source, `%${q}%`)
        )
      );
    }

    if (sentiment !== "all" && (SENTIMENTS as readonly string[]).includes(sentiment)) {
      conditions.push(eq(productAnalyses.sentiment, sentiment as any));
    }

    conditions.push(gte(productAnalyses.score10, minScore));
    conditions.push(lte(productAnalyses.score10, maxScore));

    const where = and(...conditions);

    const orderBy =
      sort === "oldest"
        ? productAnalyses.createdAt
        : sort === "score_high"
        ? desc(productAnalyses.score10)
        : sort === "score_low"
        ? productAnalyses.score10
        : desc(productAnalyses.createdAt);

    const countRows = await db
      .select({ total: sql<number>`count(*)` })
      .from(productAnalyses)
      .where(where);

    const total = Number(countRows?.[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = clamp(page, 1, totalPages);
    const offset = (safePage - 1) * pageSize;

    const rows = await db
      .select({
        id: productAnalyses.id,
        productName: productAnalyses.productName,
        source: productAnalyses.source,
        score10: productAnalyses.score10,
        sentiment: productAnalyses.sentiment,
        createdAt: productAnalyses.createdAt,
      })
      .from(productAnalyses)
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json(
      {
        items: rows.map((r) => ({
          ...r,
          createdAt: (r.createdAt as any)?.toISOString?.() ?? String(r.createdAt),
        })),
        pagination: { page: safePage, pageSize, total, totalPages },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
