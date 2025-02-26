import { env } from "~/env";
import * as arctic from "arctic";

// export const google = new Google(
//   import.meta.env.GOOGLE_CLIENT_ID,
//   import.meta.env.GOOGLE_CLIENT_SECRET,
//   "http://localhost:4321/login/google/callback"
// );
export const generateState = () => arctic.generateState();
export const generateCodeVerifier = () => arctic.generateCodeVerifier();

export const spotifyAuth = new arctic.Spotify(
  env.SPOTIFY_CLIENT_ID,
  env.SPOTIFY_CLIENT_SECRET,
  "http://localhost:3500/api/auth/spotify/callback"
);

import { useSession } from "@tanstack/start/server";
import { createFetcher } from "./fetch";

type SessionData = {
  userId: string;
};

export function getAppSession() {
  return useSession<SessionData>({
    password: process.env.SECRET!,
  });
}

export const spotifyFetcher = createFetcher("https://api.spotify.com/v1");
export type SpotifyUser = {
  id: string;
  display_name: string;
  images: {
    url: string;
  }[];
};

export const RETURN_URL_KEY = "returnUrl";
export const STATE_KEY = "state";
export const VERIFIER_KEY = "verifier";
