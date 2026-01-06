import { pgTable, text, timestamp, boolean, index, integer, jsonb, uuid, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

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


export type ReviewSource = "manual" | "amazon" | "flipkart" | "other";

export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);

export const productAnalyses = pgTable(
  "product_analyses",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    source: text("source").notNull().default("manual"), // amazon/flipkart/manual/other
    productName: text("product_name").notNull(),
    productUrl: text("product_url"),

    // Input reviews (raw)
    reviewsText: text("reviews_text").notNull(),

    // NEW (recommended): store extracted/known number of reviews
    // If you parse reviews from a URL, set this properly at save time.
    reviewCount: integer("review_count").notNull().default(0),

    // Output
    score10: integer("score_10").notNull(), // 1..10
    sentiment: sentimentEnum("sentiment").notNull(),

    // Optional structured insights
    summary: text("summary"),
    keywords: jsonb("keywords").$type<string[]>().default([]),
    aspectScores: jsonb("aspect_scores")
      .$type<Record<string, number>>()
      .default({}),

    // Recommended: use timezone timestamps (Neon/Postgres best practice)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Keep your existing indexes if you want, but these are more useful for dashboards:

    // Core filters
    userIdx: index("product_analyses_user_idx").on(t.userId),

    // Time-based queries per user (history, dashboards)
    userCreatedIdx: index("product_analyses_user_created_idx").on(t.userId, t.createdAt),

    // Insights aggregations
    userSentimentIdx: index("product_analyses_user_sentiment_idx").on(t.userId, t.sentiment),
    userScoreIdx: index("product_analyses_user_score_idx").on(t.userId, t.score10),
    userSourceIdx: index("product_analyses_user_source_idx").on(t.userId, t.source),

    // Top products grouping
    userProductIdx: index("product_analyses_user_product_idx").on(t.userId, t.productName),

    // Optional: keep the old createdIdx (but userCreatedIdx usually replaces it)
    // createdIdx: index("product_analyses_created_idx").on(t.createdAt),
  })
);

export type ReportRangePreset = "7d" | "30d" | "90d" | "all" | "custom";

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    preset: text("preset").notNull().default("30d"), // 7d/30d/90d/all/custom

    dateFrom: timestamp("date_from"), // nullable for "all"
    dateTo: timestamp("date_to"), // nullable for "all"

    // Snapshot payloads (so report remains stable over time)
    kpis: jsonb("kpis")
      .$type<{
        totalAnalyses: number;
        avgScore10: number | null;
        bestScore10: number | null;
        worstScore10: number | null;
        lastActivityAt: string | null;
      }>()
      .notNull(),

    sentiment: jsonb("sentiment")
      .$type<{
        positive: number;
        neutral: number;
        negative: number;
      }>()
      .notNull(),

    topProducts: jsonb("top_products")
      .$type<
        Array<{
          productName: string;
          count: number;
          avgScore10: number | null;
          sentimentMode: "positive" | "neutral" | "negative";
        }>
      >()
      .notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("reports_user_idx").on(t.userId),
    createdIdx: index("reports_created_idx").on(t.createdAt),
  })
);

export type ReportRow = typeof reports.$inferSelect;
export type NewReportRow = typeof reports.$inferInsert;

export type ProductAnalysis = typeof productAnalyses.$inferSelect;
export type NewProductAnalysis = typeof productAnalyses.$inferInsert;

export const notificationPrefs = pgTable(
  "notification_prefs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Email notifications
    emailProductInsights: boolean("email_product_insights").notNull().default(true),
    emailWeeklyDigest: boolean("email_weekly_digest").notNull().default(false),
    emailSecurityAlerts: boolean("email_security_alerts").notNull().default(true),

    // Product UX prefs
    defaultSource: text("default_source").notNull().default("manual"), // amazon|flipkart|manual|other
    autoSaveAnalyses: boolean("auto_save_analyses").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("notification_prefs_user_idx").on(t.userId),
    userUnique: uniqueIndex("notification_prefs_user_unique").on(t.userId),
  })
);