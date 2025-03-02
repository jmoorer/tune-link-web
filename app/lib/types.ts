import { getCurrentUser } from "~/api/auth";
import {
  generationInputSchema,
  playlistResultSchema,
  providerTypeSchema,
} from "~/lib/validators";
import { z } from "zod";
import { getPlaylistByShortcode } from "~/api/playlist";

type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = Awaited<
  ReturnType<T>
>;
export type ProviderType = z.infer<typeof providerTypeSchema>;

export type GenerationParams = z.infer<typeof generationInputSchema>;
export type AppUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export type PlaylistDetails = AsyncReturnType<typeof getPlaylistByShortcode>;
export type PlaylistResult = z.infer<typeof playlistResultSchema>;
export type EnrichedTrack = PlaylistResult["tracks"][number] & {
  coverArt?: string;
  previewUrl?: string;
  album?: string;
};
export type GeneratedPlaylist = PlaylistResult & {
  tracks: EnrichedTrack[];
};
