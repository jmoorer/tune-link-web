import { env } from "~/env";
import jwt from "jsonwebtoken";

import { createFetcher } from "../fetch";
import {
  CreatePlaylistRequest,
  MatchResults,
  PlaylistService,
} from "./transfer";
import { EnrichedTrack } from "../types";
import { chunk } from "../utils";
import { itunesSearch } from "./itunes";

type Station = {
  id: string;
  attributes: {
    name: string;
    url: string;
    artwork: {
      url: string;
    };
  };
};

export type StationResponse = {
  data: Station[];
};
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

export const getPersonalStation = async (userToken: string) => {
  const result = await appleMusicFetcher<StationResponse>(
    "/catalog/us/stations?filter[identity]=personal",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${generateDeveloperToken()}`,
        "Music-User-Token": userToken,
      },
    }
  );
  return result.data.at(0);
};
type LibraryPlaylistsResponse = {
  data: LibraryPlaylists[];
};
type LibraryPlaylists = {
  id: string;
  type: "library-playlists";
  href: string;
  attributes: {
    name: string;
    description: {
      standard: string;
    };
  };
};
type LibraryPlaylistCreationRequest = {
  attributes: {
    name: string;
    description?: string;
  };
};
type AppleMusicSearchResults = {
  results: {
    songs: {
      data: AppleMusicTrack[];
    };
  };
};
type AppleMusicTrack = {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
  };
};
export class AppleMusicService implements PlaylistService {
  constructor(private readonly userToken: string) {}

  get headers() {
    return {
      Authorization: `Bearer ${generateDeveloperToken()}`,
      "Music-User-Token": this.userToken,
    };
  }
  async getPlaylist(id: string) {
    const result = await appleMusicFetcher<StationResponse>(
      `/catalog/us/stations/${id}`,
      {
        method: "GET",
        headers: this.headers,
      }
    );
    return {
      id: result.data.at(0)?.id ?? "",
      title: result.data.at(0)?.attributes.name ?? "",
      description: "",
      image: result.data.at(0)?.attributes.artwork.url ?? "",
      tracks: [],
      url: result.data.at(0)?.attributes.url ?? "",
    };
  }
  async createPlaylist(request: CreatePlaylistRequest) {
    const body: LibraryPlaylistCreationRequest = {
      attributes: {
        name: request.title,
        description: request.description,
      },
    };
    const result = await appleMusicFetcher<LibraryPlaylistsResponse>(
      "/me/library/playlists",
      {
        method: "POST",
        headers: this.headers,
        body,
      }
    );
    const playlist = result.data.at(0);
    if (!playlist) {
      throw new Error("Failed to create playlist");
    }
    return {
      id: playlist.id,
      title: playlist.attributes.name,
      description: request.description ?? "",
      image: "",
      tracks: [],
      url: `https://music.apple.com/library/playlist/${playlist.id}`,
    };
  }
  async addTracksToPlaylist(playlistId: string, trackIds: string[]) {
    await appleMusicFetcher<void>(
      `/me/library/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: this.headers,
        body: {
          data: trackIds.map((id) => ({ id, type: "songs" })),
        },
      }
    );
  }
  async deletePlaylist(playlistId: string) {
    console.log("Deleting playlist", playlistId);
  }
  async findMatchingTracks(tracks: EnrichedTrack[]) {
    console.log("Finding matching tracks", tracks);
    const batchedTracks = chunk(tracks, 5);
    const trackMatches: MatchResults = {
      matches: [],
      misses: [],
    };
    for (const batch of batchedTracks) {
      const results = await Promise.all(
        batch.map(async (track) => {
          const i = await itunesSearch(track.title, track.artist);
          console.log(i);
          if (i.length === 0) {
            console.log("No matches found for", track);
            return null;
          }
          const itunesMatch = i[0];
          return {
            source: track,
            target: {
              id: itunesMatch.trackId.toString(),
              title: itunesMatch.trackName,
              artist: itunesMatch.artistName,
            },
          };
          return null;
          const searchResults =
            await appleMusicFetcher<AppleMusicSearchResults>(
              `/catalog/us/search`,
              {
                method: "GET",
                headers: this.headers,
                query: {
                  term: `${track.title} ${track.artist}`,
                  types: "songs",
                },
              }
            );
          if (searchResults.results.songs.data.length === 0) {
            console.log("No matches found for", track);
            return null;
          }
          const match = searchResults.results.songs.data[0];

          return {
            source: track,
            target: {
              id: match.id,
              title: match.attributes.name,
              artist: match.attributes.artistName,
            },
          };
        })
      );
      // trackMatches.matches.push(...results.filter((match) => match !== null));
      trackMatches.matches.push(...results.filter((match) => match !== null));
      trackMatches.misses.push(
        ...batch.filter(
          (track) =>
            !results.some((match) => match?.source.title === track.title)
        )
      );
    }

    return trackMatches;
  }
}
