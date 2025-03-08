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

// Type definitions for Apple MusicKit Web API

declare namespace MusicKit {
  // Configuration interfaces
  interface Configuration {
    developerToken: string;
    app: {
      name: string;
      build?: string;
    };
    storefrontId?: string;
    bitrate?: PlaybackBitrate;
    suppressErrorDialog?: boolean;
  }

  // Main MusicKit class
  interface MusicKitInstance {
    readonly api: API;
    readonly isAuthorized: boolean;
    readonly musicUserToken: string | null;
    readonly storefrontId: string;
    readonly storekit: StoreKit;
    readonly volume: number;
    readonly player: Player;
    readonly subscribedToCloudLibrary: boolean;

    authorize(): Promise<string>;
    unauthorize(): Promise<void>;
    changeUserStorefront(storefrontId: string): Promise<void>;
    configure(configuration: Configuration): MusicKitInstance;
    setVolume(volume: number): void;
    subscribeToEntityChanges(callback: (notification: any) => void): void;
    unsubscribeFromEntityChanges(callback: (notification: any) => void): void;
    addEventListener(eventName: string, callback: (event: any) => void): void;
    removeEventListener(
      eventName: string,
      callback: (event: any) => void
    ): void;
    version: string;
  }

  // Player interfaces
  enum PlaybackStates {
    none = 0,
    loading = 1,
    playing = 2,
    paused = 3,
    stopped = 4,
    ended = 5,
    seeking = 6,
    waiting = 8,
    stalled = 9,
    completed = 10,
  }

  enum PlaybackBitrate {
    HIGH = 256,
    STANDARD = 64,
  }

  interface Metadata {
    albumName: string;
    artistName: string;
    artworkURL: string;
    playlistName?: string;
    songName: string;
    duration: number;
  }

  interface PlaybackProgress {
    currentPlaybackTime: number;
    currentPlaybackDuration: number;
    currentPlaybackTimeRemaining: number;
  }

  interface QueueOptions {
    album?: string;
    songs?: string[];
    song?: string;
    playlists?: string[];
    playlist?: string;
    startPlaying?: boolean;
    startPosition?: number;
  }

  interface SetQueueOptions extends QueueOptions {
    startPosition?: number;
  }

  interface Player {
    readonly bitrate: PlaybackBitrate;
    readonly canSupportDRM: boolean;
    readonly currentPlaybackDuration: number;
    readonly currentPlaybackProgress: number;
    readonly currentPlaybackTime: number;
    readonly currentPlaybackTimeRemaining: number;
    readonly isPlaying: boolean;
    readonly metadata: Metadata;
    readonly nowPlayingItem: MediaItem;
    readonly nowPlayingItemIndex: number;
    readonly playbackRate: number;
    readonly playbackState: PlaybackStates;
    readonly queue: Queue;
    readonly repeatMode: number;
    readonly shuffleMode: number;
    readonly volume: number;
    readonly isPrimaryPlayer: boolean;

    changeToMediaAtIndex(index: number): Promise<void>;
    changeToMediaItem(mediaItem: MediaItem): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    stop(): Promise<void>;
    seek(time: number): Promise<void>;
    skipToNextItem(): Promise<void>;
    skipToPreviousItem(): Promise<void>;
    setVolume(volume: number): void;
    setQueue(options: SetQueueOptions): Promise<void>;
    prepareToPlay(): Promise<void>;
    showPlaybackTargetPicker(): void;
    addEventListener(eventName: string, callback: (event: any) => void): void;
    removeEventListener(
      eventName: string,
      callback: (event: any) => void
    ): void;
  }

  interface Queue {
    readonly isEmpty: boolean;
    readonly items: MediaItem[];
    readonly position: number;

    shuffle(mode: boolean): void;
    repeatOne(mode: boolean): void;
    repeatAll(mode: boolean): void;
  }

  // API interfaces
  interface API {
    music(
      endpoint: string,
      parameters?: object,
      options?: APIOptions
    ): Promise<any>;
    personalLibrary(
      endpoint: string,
      parameters?: object,
      options?: APIOptions
    ): Promise<any>;
    userToken: string | null;
    storefrontId: string;
  }

  interface APIOptions {
    fetchOptions?: RequestInit;
    includeResponseMeta?: boolean;
  }

  // StoreKit interface
  interface StoreKit {
    storefrontId: string;
    authorize(): Promise<string>;
    unauthorize(): Promise<void>;
    eligibleForSubscribeView: boolean;
    extend(method: string, options?: any): Promise<any>;
    canStartTrialOnDevice(): Promise<boolean>;
    presentSubscribeView(): Promise<string>;
  }

  // Media types
  interface MediaItem {
    readonly id: string;
    readonly type: string;
    readonly href: string;
    readonly attributes: MediaItemAttributes;
    readonly relationships?: Record<string, Relationship>;
    readonly container?: MediaItem;
    readonly playbackDuration: number;
    albumInfo?: string;
    artistInfo?: string;
    artwork?: Artwork;

    playParams: PlayParameters;
    artworkURL: string;
    contentRating?: ContentRating;
    isPlayable: boolean;
    title: string;
  }

  interface MediaItemAttributes {
    albumName?: string;
    artistName: string;
    artwork?: Artwork;
    composerName?: string;
    contentRating?: ContentRating;
    discNumber?: number;
    durationInMillis?: number;
    genreNames?: string[];
    isrc?: string;
    name: string;
    playParams?: PlayParameters;
    previews?: Preview[];
    releaseDate?: string;
    trackNumber?: number;
    url?: string;
  }

  interface Relationship {
    data: MediaItem[];
    href?: string;
    meta?: any;
    next?: string;
  }

  interface Artwork {
    url: string;
    width: number;
    height: number;
    textColor1?: string;
    textColor2?: string;
    textColor3?: string;
    textColor4?: string;
    bgColor?: string;
  }

  type ContentRating = "clean" | "explicit" | "none";

  interface PlayParameters {
    id: string;
    kind: string;
    catalogId?: string;
    isLibrary?: boolean;
  }

  interface Preview {
    url: string;
    hlsUrl?: string;
  }

  // Library types
  interface LibraryAlbum extends MediaItem {
    artistName: string;
    artistId: string;
    artwork: Artwork;
    contentRating?: ContentRating;
    dateAdded: string;
    name: string;
    playParams: PlayParameters;
    releaseDate: string;
    trackCount: number;
  }

  interface LibraryArtist extends MediaItem {
    artwork?: Artwork;
    name: string;
  }

  interface LibraryPlaylist extends MediaItem {
    artwork?: Artwork;
    canEdit: boolean;
    dateAdded: string;
    description?: string;
    hasCatalog: boolean;
    name: string;
    playParams: PlayParameters;
  }

  interface LibrarySong extends MediaItem {
    albumName: string;
    albumId: string;
    artistName: string;
    artistId: string;
    artwork: Artwork;
    contentRating?: ContentRating;
    dateAdded: string;
    discNumber: number;
    durationInMillis: number;
    genreNames: string[];
    name: string;
    playParams: PlayParameters;
    releaseDate: string;
    trackNumber: number;
  }

  // Static methods
  interface MusicKitClass {
    readonly MusicKitInstance: MusicKitInstance;
    readonly version: string;

    configure(configuration: Configuration): MusicKitInstance;
    getInstance(): MusicKitInstance;
    formatMediaTime(seconds: number, separator?: string): string;
    formatMediaTime(milliseconds: number, separator?: string): string;
    unauthorize(): Promise<void>;
  }

  // Events
  interface Events {
    authorizationStatusDidChange: string;
    authorizationStatusWillChange: string;
    eligibleForSubscribeView: string;
    mediaCanPlay: string;
    mediaItemDidChange: string;
    mediaItemStateDidChange: string;
    mediaItemStateWillChange: string;
    mediaItemWillChange: string;
    mediaPlaybackError: string;
    metadataDidChange: string;
    playbackBitrateDidChange: string;
    playbackDurationDidChange: string;
    playbackProgressDidChange: string;
    playbackStateDidChange: string;
    playbackStateWillChange: string;
    playbackTargetAvailableDidChange: string;
    playbackTimeDidChange: string;
    playbackVolumeDidChange: string;
    primaryPlayerDidChange: string;
    queueItemsDidChange: string;
    queuePositionDidChange: string;
    shuffleModeDidChange: string;
    repeatModeDidChange: string;
    storefrontCountryCodeDidChange: string;
    storefrontIdentifierDidChange: string;
    userTokenDidChange: string;
  }
}

// MusicKit global
declare global {
  // interface Window {
  //   MusicKit: MusicKit.MusicKitClass & {
  //     Events: MusicKit.Events;
  //   };
  // }
  const MusicKit: MusicKit.MusicKitClass & {
    Events: MusicKit.Events;
  };
}

// Export as module
export default MusicKit;
