import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { productAnalyses, users } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyzePayload = {
  source?: "manual" | "amazon" | "flipkart" | "other";
  productName: string;
  productUrl?: string;
  reviewsText: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function analyzeText(reviewsText: string) {
  const t = reviewsText.toLowerCase();

  const positives = ["good", "great", "excellent", "awesome", "amazing", "love", "perfect", "worth"];
  const negatives = ["bad", "worst", "poor", "waste", "broken", "refund", "return", "delay", "damaged"];

  let p = 0;
  let n = 0;

  for (const w of positives) if (t.includes(w)) p += 1;
  for (const w of negatives) if (t.includes(w)) n += 1;

  const score10 = clamp(5 + (p - n), 1, 10);
  const sentiment = score10 >= 7 ? "positive" : score10 <= 4 ? "negative" : "neutral";

  const keywords = Array.from(
    new Set(
      t
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 5)
    )
  ).slice(0, 8);

  const summary =
    sentiment === "positive"
      ? "Overall feedback is positive with multiple favorable mentions."
      : sentiment === "negative"
      ? "Overall feedback is negative with several concerns highlighted."
      : "Overall feedback is mixed with both positives and negatives.";

  return { score10, sentiment, keywords, summary };
}

function unauthorizedDebug(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  return {
    cookiePresent: cookie.length > 0,
    cookiePreview: cookie.slice(0, 160),
  };
}

export async function POST(req: Request) {
  try {
    const a = auth();
    const userId = (await a).userId ?? null;

    if (!userId) {
      // This tells us if cookies are even reaching the API route
      return NextResponse.json(
        { error: "Unauthorized", debug: unauthorizedDebug(req) },
        { status: 401 }
      );
    }

    const body = (await req.json()) as AnalyzePayload;

    if (!body?.productName?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (!body?.reviewsText?.trim() || body.reviewsText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide at least 20 characters of reviews" },
        { status: 400 }
      );
    }

    // Ensure user exists in DB
    const u = await db.select().from(users).where(eq(users.id, userId));
    if (!u[0]) {
      // Try to read Clerk user for a clearer hint (optional)
      const cu = await currentUser().catch(() => null);

      return NextResponse.json(
        {
          error: "User not synced to database",
          hint: "Call GET /api/users/me once after sign-in to create the DB row.",
          clerkUser: cu ? { id: cu.id, email: cu.emailAddresses?.[0]?.emailAddress ?? null } : null,
        },
        { status: 409 }
      );
    }

    const source = body.source ?? "manual";
    const productName = body.productName.trim();
    const productUrl = body.productUrl?.trim() || null;
    const reviewsText = body.reviewsText.trim();

    const result = analyzeText(reviewsText);

    const inserted = await db
      .insert(productAnalyses)
      .values({
        userId,
        source,
        productName,
        productUrl: productUrl ?? undefined,
        reviewsText,
        score10: result.score10,
        sentiment: result.sentiment,
        summary: result.summary,
        keywords: result.keywords,
        aspectScores: {},
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ analysis: inserted[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const a = auth();
    const userId = (await a).userId ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", debug: unauthorizedDebug(req) },
        { status: 401 }
      );
    }

    const rows = await db
      .select()
      .from(productAnalyses)
      .where(eq(productAnalyses.userId, userId))
      .orderBy(desc(productAnalyses.createdAt))
      .limit(10);

    return NextResponse.json({ analyses: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
