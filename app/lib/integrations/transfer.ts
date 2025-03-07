import {
  EnrichedTrack,
  GeneratedPlaylist,
  PlaylistDetails,
  StreamingPlaylist,
} from "../types";

export interface PlaylistService {
  getPlaylist(id: string): Promise<StreamingPlaylist>;
  createPlaylist(playlist: CreatePlaylistRequest): Promise<StreamingPlaylist>;
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void>;
  deletePlaylist(playlistId: string): Promise<void>;
  findMatchingTracks(
    tracks: Pick<EnrichedTrack, "title" | "artist" | "album">[]
  ): Promise<MatchResults>;
}

export type CreatePlaylistRequest = {
  title: string;
  description?: string;
  image?: string;
};
export type MatchResults = {
  matches: {
    source: EnrichedTrack;
    target: {
      id: string;
      title: string;
      artist: string;
    };
  }[];
  misses: EnrichedTrack[];
};

export class TransferService {
  constructor(private readonly service: PlaylistService) {}

  async transferPlaylist(playlist: GeneratedPlaylist) {
    const matchResults = await this.service.findMatchingTracks(
      playlist.tracks.map((track) => ({
        title: track.title,
        artist: track.artist,
      }))
    );
    if (matchResults.misses.length > 0) {
      throw new Error(
        `Failed to find matches for ${matchResults.misses.length} tracks`
      );
    }
    const playlistResult = await this.service.createPlaylist({
      title: playlist.title,
      description: playlist.description ?? undefined,
    });

    await this.service.addTracksToPlaylist(
      playlistResult.id,
      matchResults.matches.map((match) => match.target.id)
    );

    return {
      playlist: playlistResult,
      matchResults,
    };
  }
}
