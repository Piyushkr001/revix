import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    // Clerk userId
    id: text("id").primaryKey(),

    email: text("email").notNull(),
    name: text("name"),
    imageUrl: text("image_url"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
  })
);
