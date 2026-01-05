import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/config/db";
import { users } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  try {
    // ✅ No `any` casting; Clerk returns typed { userId }
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          hint: "No userId from auth(). Ensure you are signed in and middleware is configured.",
        },
        { status: 401 }
      );
    }

    const cu = await currentUser();
    if (!cu) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          hint: "currentUser() returned null. Check ClerkProvider + middleware matcher.",
        },
        { status: 401 }
      );
    }

    const email = cu.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "Bad Request", hint: "No email found in Clerk user." },
        { status: 400 }
      );
    }

    const name =
      [cu.firstName, cu.lastName].filter(Boolean).join(" ") ||
      cu.username ||
      null;

    const imageUrl = cu.imageUrl ?? null;

    // ✅ Find by id
    const existing = await db.select().from(users).where(eq(users.id, userId));

    // ✅ Update if exists
    if (existing[0]) {
      await db
        .update(users)
        .set({
          email,
          name,
          imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      const refreshed = await db.select().from(users).where(eq(users.id, userId));
      return NextResponse.json({ user: refreshed[0] }, { status: 200 });
    }

    // ✅ Insert if not exists
    await db.insert(users).values({
      id: userId,
      email,
      name,
      imageUrl,
      isActive: true,
      updatedAt: new Date(),
    });

    const created = await db.select().from(users).where(eq(users.id, userId));
    return NextResponse.json({ user: created[0] }, { status: 201 });
  } catch (err: any) {
    console.error("GET /api/users/me error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
