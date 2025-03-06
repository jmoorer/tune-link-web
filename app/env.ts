import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

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
  },
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_DB_VERSION: z.coerce.number(),
  },
  runtimeEnv: {
    ...process.env,
    PUBLIC_DB_VERSION: import.meta.env.PUBLIC_DB_VERSION,
  },
});
