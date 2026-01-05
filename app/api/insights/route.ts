import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { productAnalyses } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const whereUser = eq(productAnalyses.userId, userId);

    // ---- totals ----
    const totalsRows = await db
      .select({
        totalAnalyses: sql<number>`count(*)`,
        totalReviews: sql<number>`coalesce(sum(${productAnalyses.reviewCount}), 0)`,
        avgScore: sql<number | null>`avg(${productAnalyses.score10})`,
        bestScore: sql<number | null>`max(${productAnalyses.score10})`,
        worstScore: sql<number | null>`min(${productAnalyses.score10})`,
      })
      .from(productAnalyses)
      .where(whereUser);

    const totals = totalsRows?.[0] ?? {
      totalAnalyses: 0,
      totalReviews: 0,
      avgScore: null,
      bestScore: null,
      worstScore: null,
    };

    const totalAnalyses = Number(totals.totalAnalyses ?? 0);
    const hasData = totalAnalyses > 0;

    if (!hasData) {
      return NextResponse.json(
        {
          hasData: false,
          updatedAt: new Date().toISOString(),
          totals: {
            totalAnalyses: 0,
            totalReviews: 0,
            avgScore: null,
            bestScore: null,
            worstScore: null,
          },
          sentiment: { positive: 0, neutral: 0, negative: 0 },
          buckets: { low_1_3: 0, mid_4_6: 0, good_7_8: 0, great_9_10: 0 },
          topSources: [],
          topProducts: [],
          trend14d: [],
        },
        { status: 200 }
      );
    }

    // ---- sentiment counts ----
    const sentimentRows = await db
      .select({
        sentiment: productAnalyses.sentiment,
        count: sql<number>`count(*)`,
      })
      .from(productAnalyses)
      .where(whereUser)
      .groupBy(productAnalyses.sentiment);

    const sentiment = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    for (const r of sentimentRows) {
      const key = String(r.sentiment) as keyof typeof sentiment;
      if (key in sentiment) sentiment[key] = Number(r.count ?? 0);
    }

    // ---- buckets via conditional sums ----
    const bucketRows = await db
      .select({
        low_1_3: sql<number>`sum(case when ${productAnalyses.score10} between 1 and 3 then 1 else 0 end)`,
        mid_4_6: sql<number>`sum(case when ${productAnalyses.score10} between 4 and 6 then 1 else 0 end)`,
        good_7_8: sql<number>`sum(case when ${productAnalyses.score10} between 7 and 8 then 1 else 0 end)`,
        great_9_10: sql<number>`sum(case when ${productAnalyses.score10} between 9 and 10 then 1 else 0 end)`,
      })
      .from(productAnalyses)
      .where(whereUser);

    const buckets = {
      low_1_3: Number(bucketRows?.[0]?.low_1_3 ?? 0),
      mid_4_6: Number(bucketRows?.[0]?.mid_4_6 ?? 0),
      good_7_8: Number(bucketRows?.[0]?.good_7_8 ?? 0),
      great_9_10: Number(bucketRows?.[0]?.great_9_10 ?? 0),
    };

    // ---- top sources ----
    const topSources = await db
      .select({
        source: sql<string>`coalesce(${productAnalyses.source}, 'Unknown')`,
        count: sql<number>`count(*)`,
        avgScore: sql<number | null>`avg(${productAnalyses.score10})`,
      })
      .from(productAnalyses)
      .where(whereUser)
      .groupBy(sql`coalesce(${productAnalyses.source}, 'Unknown')`)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(5);

    // ---- top products ----
    const topProducts = await db
      .select({
        productName: productAnalyses.productName,
        count: sql<number>`count(*)`,
        avgScore: sql<number | null>`avg(${productAnalyses.score10})`,
      })
      .from(productAnalyses)
      .where(whereUser)
      .groupBy(productAnalyses.productName)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(5);

    // ---- 14-day trend (day + count + avg) ----
    // Postgres: date_trunc('day', created_at)
    const trend14d = await db.execute(sql<{
      day: string;
      count: number;
      avgscore: number | null;
    }>`
      select
        to_char(date_trunc('day', ${productAnalyses.createdAt}), 'YYYY-MM-DD') as day,
        count(*)::int as count,
        avg(${productAnalyses.score10}) as avgscore
      from ${productAnalyses}
      where ${productAnalyses.userId} = ${userId}
        and ${productAnalyses.createdAt} >= now() - interval '14 days'
      group by 1
      order by 1 asc
    `);

    return NextResponse.json(
      {
        hasData: true,
        updatedAt: new Date().toISOString(),
        totals: {
          totalAnalyses,
          totalReviews: Number(totals.totalReviews ?? 0),
          avgScore: totals.avgScore == null ? null : Number(totals.avgScore),
          bestScore: totals.bestScore == null ? null : Number(totals.bestScore),
          worstScore: totals.worstScore == null ? null : Number(totals.worstScore),
        },
        sentiment,
        buckets,
        topSources: topSources.map((s) => ({
          source: String(s.source),
          count: Number(s.count ?? 0),
          avgScore: s.avgScore == null ? null : Number(s.avgScore),
        })),
        topProducts: topProducts.map((p) => ({
          productName: String(p.productName),
          count: Number(p.count ?? 0),
          avgScore: p.avgScore == null ? null : Number(p.avgScore),
        })),
        trend14d: (trend14d?.rows ?? []).map((r) => ({
          day: r.day,
          count: Number(r.count),
          avgScore: r.avgscore == null ? null : Number(r.avgscore),
        })),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /api/insights error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
