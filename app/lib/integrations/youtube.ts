import { env } from "~/env";
import * as arctic from "arctic";
import { createFetcher } from "../fetch";

export const youtubeAuth = new arctic.Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.APP_URL}/api/auth/youtube/callback`
);

export const youtubeFetcher = createFetcher(
  "https://www.googleapis.com/youtube/v3"
);
export const googleFetcher = createFetcher(
  "https://www.googleapis.com/oauth2/v3"
);

export type GoogleUser = {
  sub: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
};

export const getYoutubeUser = async (token: string) => {
  const response = await googleFetcher<GoogleUser>("/userinfo", {
    token,
    method: "GET",
  });
  return response;
};
