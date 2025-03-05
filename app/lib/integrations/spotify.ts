import { env } from "~/env";
import * as arctic from "arctic";
import { createFetcher, Fetcher } from "../fetch";
import {
  CreatePlaylistRequest,
  MatchResults,
  PlaylistService,
} from "./transfer";
import { EnrichedTrack, StreamingPlaylist } from "../types";

export const spotifyAuth = new arctic.Spotify(
  env.SPOTIFY_CLIENT_ID,
  env.SPOTIFY_CLIENT_SECRET,
  `${env.APP_URL}/api/auth/spotify/callback`
);

export const spotifyFetcher = createFetcher("https://api.spotify.com/v1");

export type SpotifyUser = {
  id: string;
  display_name: string;
  images: {
    url: string;
  }[];
};
type SpotifyTrack = {
  id: string;
  name: string;
  artists: {
    name: string;
  }[];
};
type SpotifyPlaylist = {
  id: string;
  name: string;
  description: string;
  images: {
    url: string;
  }[];
};
type SpotifySearchResults = {
  tracks: {
    items: SpotifyTrack[];
  };
};

export class SpotifyService implements PlaylistService {
  private readonly fetcher: Fetcher;
  private readonly userPromise: Promise<SpotifyUser>;
  constructor(token: string) {
    this.fetcher = createFetcher("https://api.spotify.com/v1", token);
    this.userPromise = this.fetcher<SpotifyUser>("/me", {
      method: "GET",
    });
  }

  async getPlaylist(id: string): Promise<StreamingPlaylist> {
    const playlist = await this.fetcher<SpotifyPlaylist>(`/playlists/${id}`, {
      method: "GET",
    });
    return {
      id: playlist.id,
      title: playlist.name,
      description: playlist.description,
      image: playlist.images[0].url,
      tracks: [],
      url: `https://open.spotify.com/playlist/${playlist.id}`,
    };
  }
  async createPlaylist(request: CreatePlaylistRequest) {
    const user = await this.userPromise;
    const playlist = await this.fetcher<SpotifyPlaylist>(
      `/users/${user.id}/playlists`,
      {
        method: "POST",
        body: {
          name: request.title,
          description: request.description,
          public: false,
        },
      }
    );
    return {
      id: playlist.id,
      title: playlist.name,
      description: playlist.description,
      image: playlist.images.at(0)?.url,
      tracks: [],
      url: `https://open.spotify.com/playlist/${playlist.id}`,
    };
  }
  async findMatchingTracks(tracks: EnrichedTrack[]) {
    const trackMatches = await Promise.all(
      tracks.map(async (track) => {
        const searchResults = await this.fetcher<SpotifySearchResults>(
          `/search`,
          {
            method: "GET",
            query: {
              q: `${track.title} ${track.artist}`,
              type: "track",
              limit: "1",
            },
          }
        );
        if (searchResults.tracks.items.length === 0) {
          console.log("No matches found for", track);
          return null;
        }
        return {
          source: track,
          target: {
            id: searchResults.tracks.items[0].id,
            title: searchResults.tracks.items[0].name,
            artist: searchResults.tracks.items[0].artists[0].name,
          },
        };
      })
    );

    return {
      matches: trackMatches.filter((match) => match !== null),
      misses: tracks.filter((track) =>
        trackMatches.every((match) => match?.source.title !== track.title)
      ),
    } satisfies MatchResults;
  }
  async addTracksToPlaylist(playlistId: string, trackIds: string[]) {
    await this.fetcher(`/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: { uris: trackIds.map((id) => `spotify:track:${id}`) },
    });
  }
  async deletePlaylist(playlistId: string) {
    await this.fetcher(`/playlists/${playlistId}/followers`, {
      method: "DELETE",
    });
  }
}
