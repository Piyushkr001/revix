import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { productAnalyses } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 15/16 can be Promise-based params
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Missing id" }, { status: 400 });
    }

    // ✅ Only return record owned by this user
    const rows = await db
      .select()
      .from(productAnalyses)
      .where(and(eq(productAnalyses.id, id), eq(productAnalyses.userId, userId)))
      .limit(1);

    const item = rows[0];
    if (!item) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // ✅ Normalize dates for JSON
    const safeItem = {
      ...item,
      createdAt: (item.createdAt as any)?.toISOString?.() ?? String(item.createdAt),
      updatedAt: (item.updatedAt as any)?.toISOString?.() ?? (item as any).updatedAt ?? null,
    };

    return NextResponse.json({ item: safeItem }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/history/[id] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
