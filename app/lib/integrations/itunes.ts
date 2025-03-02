import { createFetcher } from "../fetch";

export interface ITunesSearchResult {
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
  artist?: string
): Promise<ITunesSearchResult[]> => {
  const searchTerm = `${title} ${artist ? ` ${artist}` : ""}`;
  const response = await itunesFetcher<ITunesSearchResponse>("/search", {
    method: "GET",
    query: {
      term: searchTerm,
      entity: "song",
      limit: "10",
    },
  });

  return response.results;
};
