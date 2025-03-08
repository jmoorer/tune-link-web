import { env } from "~/env";
import jwt from "jsonwebtoken";

import { createFetcher } from "../fetch";
export const getTokenExpiration = () => {
  const exp = Math.floor(Date.now() / 1000) + 15777000;
  return exp;
};
export const generateDeveloperToken = () => {
  const exp = getTokenExpiration();
  const privateKey = Buffer.from(env.APPLE_PRIVATE_KEY, "base64").toString();

  const appleDevKey = jwt.sign(
    {
      exp,
      iss: env.APPLE_TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
    },
    privateKey,
    {
      algorithm: "ES256",
      keyid: env.APPLE_KEY_ID,
    }
  );
  return appleDevKey;
};
export const appleMusicFetcher = createFetcher(
  "https://api.music.apple.com/v1"
);
