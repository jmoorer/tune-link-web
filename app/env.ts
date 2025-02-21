import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
console.log(process.env);
export const env = createEnv({
  server: {
    OPENAI_API_KEY: z.string().min(1),
  },
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_DB_VERSION: z.coerce.number(),
  },
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PUBLIC_DB_VERSION: import.meta.env.PUBLIC_DB_VERSION,
  },
});
