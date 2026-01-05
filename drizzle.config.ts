import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load .env.local first (common in Next.js), then fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "./config/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
