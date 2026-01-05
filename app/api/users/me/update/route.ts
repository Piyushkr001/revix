import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/config/db";
import { users } from "@/config/schema";


export const runtime = "nodejs";

const UpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  imageUrl: z.string().url().optional(),
});

export async function PATCH(req: Request) {
  const { userId } : any = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, userId));

  const updated = await db.select().from(users).where(eq(users.id, userId));
  return NextResponse.json({ user: updated[0] }, { status: 200 });
}
