import "dotenv/config";
import { defineConfig } from "drizzle-kit";
console.log("env", process.env);
export default defineConfig({
  out: "./drizzle",
  schema: "./app/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
