import { createServerFn } from "@tanstack/start";
import { authMiddleware } from "./middleware";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import { generateDeveloperToken } from "~/lib/integrations/apple";
export const getConfig = createServerFn({}).handler(async ({}) => {
  const exp = Math.floor(Date.now() / 1000) + 15777000;
  console.log("env.APPLE_PRIVATE_KEY", env.APPLE_PRIVATE_KEY);
  const appleDevKey = jwt.sign(
    {
      exp,
      iss: env.APPLE_TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
    },
    env.APPLE_PRIVATE_KEY,
    {
      algorithm: "ES256",
      keyid: env.APPLE_KEY_ID,
    }
  );
  return { appleDevKey };
});

export const getAppleToken = createServerFn({}).handler(async ({}) => {
  return generateDeveloperToken();
});
