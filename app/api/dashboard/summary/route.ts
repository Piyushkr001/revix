import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const a = auth(); // ✅ do NOT destructure getToken directly

    const userId = (await a).userId ?? null;
    const sessionId = (await a).sessionId ?? null;

    const cookie = req.headers.get("cookie") ?? "";

    let tokenPresent: boolean | null = null;
    try {
      // Some versions expose getToken; some don't. Guard it.
      const maybeGetToken = (a as any)?.getToken;
      if (typeof maybeGetToken === "function") {
        const t = await maybeGetToken();
        tokenPresent = !!t;
      } else {
        tokenPresent = null; // not available in this version
      }
    } catch {
      tokenPresent = false;
    }

    let cu: any = null;
    try {
      cu = await currentUser();
    } catch {
      cu = null;
    }

    // Return structured debug payload even if unauthorized
    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          debug: {
            cookiePresent: cookie.length > 0,
            cookiePreview: cookie.slice(0, 160),
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

    // Normal dashboard response (empty state for now)
    return NextResponse.json(
      {
        hasData: false,
        updatedAt: new Date().toISOString(),
        userId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    // ✅ send the real error message back to help diagnose
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
