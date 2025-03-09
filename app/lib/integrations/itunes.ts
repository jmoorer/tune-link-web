import { createFetcher } from "../fetch";
import { normalizeString } from "../utils/stringUtils";
import { calculateSimilarity } from "../utils/stringUtils";

export interface ITunesSearchResult {
  trackId: number;
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
const itunesFetcher = createFetcher("https://itunes.apple.com");

export const itunesSearch = async (
  title: string,
  artist: string
): Promise<ITunesSearchResult[]> => {
  const searchTerm = `${title} ${artist}`;
  const response = await itunesFetcher<ITunesSearchResponse>("/search", {
    method: "GET",
    query: {
      term: searchTerm,
      entity: "song",
      limit: "10",
      media: "music",
    },
  });

  return response.results;
};

export function findBestMatch(
  originalTrack: { title: string; artist: string },
  itunesResults: ITunesSearchResult[]
) {
  if (!itunesResults || itunesResults.length === 0) return null;
  const minConfidenceThreshold = 0.5;
  const originalTitleNorm = normalizeString(originalTrack.title);
  const originalArtistNorm = normalizeString(originalTrack.artist);
  const scoredResults = itunesResults.map((result) => {
    const resultTitleNorm = normalizeString(result.trackName);
    const resultArtistNorm = normalizeString(result.artistName);
    const similarity = calculateSimilarity(originalTitleNorm, resultTitleNorm);
    const artistSimilarity = calculateSimilarity(
      originalArtistNorm,
      resultArtistNorm
    );
    const score = similarity * 0.5 + artistSimilarity * 0.5;
    return {
      result,
      similarity,
      artistSimilarity,
      score,
    };
  });
  const sortedResults = scoredResults.sort((a, b) => b.score - a.score);
  if (sortedResults[0].score >= minConfidenceThreshold) {
    return sortedResults[0];
  }
  return null;
}
