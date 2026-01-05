import { auth } from "@clerk/nextjs/server";

export function requireUserId() {
  const { userId } : any = auth();

  if (!userId) {
    // Throwing lets routes handle with consistent JSON
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }

  return userId;
}
