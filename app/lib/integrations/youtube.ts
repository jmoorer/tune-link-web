import { env } from "~/env";
import * as arctic from "arctic";
import { createFetcher } from "../fetch";
import { CreatePlaylistRequest, PlaylistService } from "./transfer";
import { EnrichedTrack } from "../types";
import { calculateSimilarity } from "../utils/stringUtils";
import { chunk, timePromise } from "~/lib/utils";

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

type YoutubeChannel = {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
};

type YoutubeChannelResponse = {
  items: YoutubeChannel[];
};

export const getYoutubeChannel = async (token: string) => {
  const response = await youtubeFetcher<YoutubeChannelResponse>(`/channels`, {
    token,
    method: "GET",
    query: {
      part: "snippet,contentDetails,statistics",
      mine: "true",
    },
  });
  return response.items?.at(0);
};

type YoutubePlaylist = {
  id: string;
  snippet: {
    title: string;
    description: string;
  };
};

type YoutubeSearchResponse<T> = {
  items: T[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
};

type YoutubeVideo = {
  id: string;
  snippet: {
    title: string;
  };
};

type YoutubeSearchResult = {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
  };
};

export class YoutubeService implements PlaylistService {
  constructor(private readonly token: string) {}

  async getPlaylist(id: string) {
    const response = await youtubeFetcher<
      YoutubeSearchResponse<YoutubePlaylist>
    >(`/playlists/${id}`, {
      token: this.token,
      method: "GET",
      query: {
        part: "snippet,contentDetails,statistics",
      },
    });
    return {
      id: response.items[0].id,
      title: response.items[0].snippet.title,
      description: response.items[0].snippet.description,
      tracks: [],
      url: `https://www.youtube.com/playlist?list=${response.items[0].id}`,
    };
  }
  async createPlaylist(request: CreatePlaylistRequest) {
    const channel = await getYoutubeChannel(this.token);
    if (!channel) {
      throw new Error(
        "User has no YouTube channel. Please visit YouTube to set up your channel first."
      );
    }
    const response = await youtubeFetcher<YoutubePlaylist>(`/playlists`, {
      token: this.token,
      method: "POST",
      query: {
        part: "snippet,status",
      },
      body: {
        snippet: {
          title: request.title,
          description: request.description,
        },
      },
    });
    return {
      id: response.id,
      title: response.snippet.title,
      description: response.snippet.description,
      tracks: [],
      url: `https://www.youtube.com/playlist?list=${response.id}`,
    };
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[]) {
    const chunks = chunk(trackIds, 10);
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (trackId) =>
          youtubeFetcher<YoutubePlaylist>(`/playlistsItems`, {
            token: this.token,
            method: "POST",
            body: {
              snippet: {
                playlistId: playlistId,
                resourceId: {
                  kind: "youtube#video",
                  videoId: trackId,
                },
              },
            },
          })
        )
      );
    }
  }

  async deletePlaylist(playlistId: string) {
    await youtubeFetcher(`/playlists/${playlistId}`, {
      token: this.token,
      method: "DELETE",
    });
  }

  async findMatchingTracks(tracks: EnrichedTrack[]) {
    const trackMatches = await Promise.all(
      tracks.map(async (track) => {
        const response = await youtubeFetcher<
          YoutubeSearchResponse<YoutubeSearchResult>
        >(`/search`, {
          token: this.token,
          method: "GET",
          query: {
            q: `${track.title} ${track.artist}`,
            type: "video",
            maxResults: "10",
            part: "snippet",
            videoEmbeddable: "true",
            videoCategoryId: "10",
          },
        });
        if (response.items.length === 0) {
          console.log("No matches found for", track);
          return null;
        }
        const videoInfo = response.items[0];
        const extractedArtist = extractArtistFromYouTube(
          videoInfo.snippet.title,
          videoInfo.snippet.channelTitle,
          track.artist
        );
        return {
          source: track,
          target: {
            id: videoInfo.id.videoId,
            title: videoInfo.snippet.title,
            artist: extractedArtist.name,
          },
        };
      })
    );
    return {
      matches: trackMatches.filter((match) => match !== null),
      misses: tracks.filter(
        (track) => !trackMatches.some((match) => match?.source === track)
      ),
    };
  }
}

type ArtistMatch = {
  name: string;
  confidence: number;
};
function extractArtistFromYouTube(
  videoTitle: string,
  channelTitle: string,
  originalArtist: string
) {
  const matches: ArtistMatch[] = [];
  // Try to extract artist from video title using common patterns

  // Pattern: "Artist - Title" or "Artist – Title" (with different dash types)
  let match1 = videoTitle.match(/^(.*?)[\s]*[-–—]\s*(.*?)(\s*\(|$)/i);

  if (match1) {
    matches.push({
      name: match1[1].trim(),
      confidence: calculateSimilarity(
        match1[1].trim().toLowerCase(),
        originalArtist.toLowerCase()
      ),
    });
  }

  // Pattern: "Title - Artist" or "Title by Artist"
  let match2 =
    videoTitle.match(/^.*?[\s]*[-–—]\s*(.*?)(\s*\(|$)/i) ||
    videoTitle.match(/^.*?[\s]*[-–—]\s*(.*?)(\s*\(|$)/i) ||
    videoTitle.match(/^.*?\s+by\s+(.*?)(\s*\(|$)/i);
  if (match2) {
    matches.push({
      name: match2[1].trim(),
      confidence: calculateSimilarity(
        match2[1].trim().toLowerCase(),
        originalArtist.toLowerCase()
      ),
    });
  }

  // Check if channel title is likely the artist

  // Remove common suffixes from channel names
  const cleanedChannelTitle = channelTitle
    .replace(/\s*VEVO$|\s*Official$|\s*Music$|\s*Records$|\s*-\s*Topic$/i, "")
    .trim();

  // Check if cleaned channel title is similar to original artist
  const similarityScore = calculateSimilarity(
    cleanedChannelTitle.toLowerCase(),
    originalArtist.toLowerCase()
  );
  if (similarityScore > 0.6) {
    // Threshold for similarity
    matches.push({
      name: cleanedChannelTitle,
      confidence: similarityScore,
    });
  }

  if (matches.length === 0) {
    return {
      name: channelTitle,
      source: "channel",
      originalArtist: originalArtist,
    };
  }

  // Get most likely artist by comparing against original

  // If we couldn't extract an artist, use the channel title as a fallback
  const [bestMatch] = matches.sort((a, b) => b.confidence - a.confidence);
  return bestMatch;
}
