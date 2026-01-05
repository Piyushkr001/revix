import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { reports } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function debugCookie(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  return {
    cookiePresent: cookie.length > 0,
    cookiePreview: cookie.slice(0, 160),
  };
}

export async function GET(req: Request) {
  try {
    const a = auth();
    const userId = (await a).userId ?? null;
    const sessionId = (await a).sessionId ?? null;

    // Optional: token presence (guarded)
    let tokenPresent: boolean | null = null;
    try {
      const maybeGetToken = (a as any)?.getToken;
      tokenPresent = typeof maybeGetToken === "function" ? !!(await maybeGetToken()) : null;
    } catch {
      tokenPresent = false;
    }

    // Optional: currentUser (guarded)
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
            ...debugCookie(req),
            userId,
            sessionId,
            tokenPresent,
            currentUser: cu ? { id: cu.id } : null,
          },
          hint:
            "If cookiePresent=false => browser not sending Clerk cookies. If cookiePresent=true but userId=null => middleware not applied or session not established.",
        },
        { status: 401 }
      );
    }

    const rows = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt))
      .limit(20);

    return NextResponse.json({ reports: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
