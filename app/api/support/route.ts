import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "@/config/db";
import { supportTickets, users } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORIES = ["general", "technical", "account", "billing", "feedback"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

function isCategory(v: unknown): v is (typeof CATEGORIES)[number] {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}
function isPriority(v: unknown): v is (typeof PRIORITIES)[number] {
  return typeof v === "string" && (PRIORITIES as readonly string[]).includes(v);
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.userId, userId), eq(supportTickets.isDeleted, false)))
      .orderBy(desc(supportTickets.createdAt))
      .limit(50);

    return NextResponse.json({ tickets: rows }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load support tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure user exists in DB (optional but consistent with your settings route)
    const cu = await currentUser();
    if (cu) {
      const email =
        cu.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
        cu.emailAddresses?.[0]?.emailAddress ??
        "";
      const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null;
      const imageUrl = cu.imageUrl ?? null;

      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true },
      });

      if (!existingUser) {
        await db.insert(users).values({ id: userId, email, name, imageUrl });
      }
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const category = isCategory(body.category) ? body.category : "general";
    const priority = isPriority(body.priority) ? body.priority : "medium";

    if (subject.length < 3) return NextResponse.json({ error: "Subject is too short" }, { status: 400 });
    if (message.length < 10) return NextResponse.json({ error: "Message is too short" }, { status: 400 });

    const meta =
      body.meta && typeof body.meta === "object"
        ? {
            page: typeof body.meta.page === "string" ? body.meta.page : undefined,
            userAgent: typeof body.meta.userAgent === "string" ? body.meta.userAgent : undefined,
            appVersion: typeof body.meta.appVersion === "string" ? body.meta.appVersion : undefined,
          }
        : {};

    const [created] = await db
      .insert(supportTickets)
      .values({
        userId,
        subject,
        message,
        category,
        priority,
        status: "open",
        meta,
      })
      .returning();

    return NextResponse.json({ ticket: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
  }
}
