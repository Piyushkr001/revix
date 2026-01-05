import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { reports } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const { userId }: any = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = ctx.params.id;
    const rows = await db
      .select()
      .from(reports)
      .where(and(eq(reports.id, id), eq(reports.userId, userId)));

    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ report: rows[0] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
