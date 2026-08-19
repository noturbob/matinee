import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: "../../apps/api/.env" });

export default {
  schema: "./src/index.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;