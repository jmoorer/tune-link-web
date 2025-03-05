import { getCurrentUser } from "~/api/auth";
import {
  generationInputSchema,
  playlistResultSchema,
  providerTypeSchema,
  playlistUpdateSchema,
} from "~/lib/validators";
import { z } from "zod";
import { getPlaylistByDetails } from "~/api/playlist";

type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = Awaited<
  ReturnType<T>
>;
export type ProviderType = z.infer<typeof providerTypeSchema>;

export type GenerationParams = z.infer<typeof generationInputSchema>;
export type AppUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export type PlaylistDetails = AsyncReturnType<typeof getPlaylistByDetails>;
export type PlaylistResult = z.infer<typeof playlistResultSchema>;
export type PlaylistUpdate = z.infer<typeof playlistUpdateSchema>;

export type EnrichedTrack = PlaylistResult["tracks"][number] & {
  coverArt?: string;
  previewUrl?: string;
  album?: string;
};

export type GeneratedPlaylist = PlaylistResult & {
  tracks: EnrichedTrack[];
};

export type StreamingPlaylist = {
  id: string;
  title: string;
  description: string;
  image?: string;
  tracks: Omit<EnrichedTrack, "position">[];
  url: string;
};
