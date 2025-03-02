import { env } from "~/env";
import * as arctic from "arctic";
import { createFetcher } from "../fetch";
export const spotifyAuth = new arctic.Spotify(
  env.SPOTIFY_CLIENT_ID,
  env.SPOTIFY_CLIENT_SECRET,
  "http://localhost:3500/api/auth/spotify/callback"
);

export const spotifyFetcher = createFetcher("https://api.spotify.com/v1");

export type SpotifyUser = {
  id: string;
  display_name: string;
  images: {
    url: string;
  }[];
};
