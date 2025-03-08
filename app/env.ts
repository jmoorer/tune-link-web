import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

console.log("ENV :", JSON.stringify(process.env, null, 2));
export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    OPENAI_API_KEY: z.string().min(1),
    SPOTIFY_CLIENT_ID: z.string(),
    SPOTIFY_CLIENT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    SECRET: z.string().optional(),
    APP_URL: z.string().optional(),
    APPLE_TEAM_ID: z.string(),
    APPLE_KEY_ID: z.string(),
    APPLE_PRIVATE_KEY: z.string(),
  },
  runtimeEnv: process.env,
});
