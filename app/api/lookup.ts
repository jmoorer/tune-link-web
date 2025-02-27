import { createServerFn } from "@tanstack/start";
import { safeValidate } from "./middleware";
import { songSearchSchema } from "~/lib/validators";
import { z } from "zod";

export const getTrackMetadata = createServerFn({ method: "POST" })
  .validator(safeValidate(songSearchSchema))
  .handler(async ({ data }) => {
    const results = await searchITunesSong(data.title, data.artist);
    const result = results[0];
    if (!results.length) {
      throw new Error("Not found");
    }

    return {
      artwork: {
        small: result.artworkUrl60,
        medium: result.artworkUrl100,
        large: result.artworkUrl100.replace("100x100", "600x600"),
      },
      previewUrl: result.previewUrl,
    };
  });

function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, (i + 1) * size)
  );
}

export const bulkGetTrackMetadata = createServerFn({ method: "POST" })
  .validator(safeValidate(songSearchSchema.extend({ id: z.string() }).array()))
  .handler(async ({ data }) => {
    const chunks = chunk(data, 10);
    const trackMap: Record<string, ITunesSearchResult> = {};
    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (tr) => {
          const result = await searchITunesSong(tr.title, tr.artist);
          if (result.length) {
            return [tr.id, result[0]] as const;
          }
          return [tr.id, null] as const;
        })
      );
      results.forEach((result) => {
        if (result[1]) {
          trackMap[result[0]] = result[1];
        }
      });
    }
    return trackMap;
  });

interface ITunesSearchResult {
  artistName: string;
  trackName: string;
  previewUrl: string;
  artworkUrl60: string;
  artworkUrl100: string;
  trackViewUrl: string;
  collectionName: string;
  releaseDate: string;
  primaryGenreName: string;
  trackTimeMillis: number;
}

interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesSearchResult[];
}

/**
 * Search for a song on iTunes by title and artist
 * @param title - The song title to search for
 * @param artist - Optional artist name to filter results
 * @returns Promise containing the search results
 */
async function searchITunesSong(
  title: string,
  artist?: string
): Promise<ITunesSearchResult[]> {
  try {
    // Construct the search query
    const searchTerm = artist ? `${title} ${artist}` : title;

    // Encode the search parameters
    const params = new URLSearchParams({
      term: searchTerm,
      entity: "song",
      limit: "10",
      media: "music",
    });

    // Make the API request
    const response = await fetch(
      `https://itunes.apple.com/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`iTunes Search failed: ${response.statusText}`);
    }

    const data: ITunesSearchResponse = await response.json();

    // If artist is provided, filter results to match the artist
    let results = data.results;
    if (artist) {
      results = results.filter((result) =>
        result.artistName.toLowerCase().includes(artist.toLowerCase())
      );
    }

    return results;
  } catch (error) {
    console.error("Error searching iTunes:", error);
    throw error;
  }
}
