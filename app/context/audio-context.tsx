import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useCallback,
  useMemo,
  type ActionDispatch,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrackMetadata } from "~/api/lookup";
import { trace } from "console";

export type AudioTrack = {
  id: string;
  title: string;
  artist: string;
  duration: number;

  artwork?: string;
};

type AudioState = {
  track: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
};

const AudioStateContext = createContext<AudioState | null>(null);
const AudioDispatchContext = createContext<ActionDispatch<
  [action: AudioActions]
> | null>(null);

type AudioActions =
  | { type: "setTrack"; payload: AudioTrack | null }
  | { type: "play" }
  | { type: "pause" };

const audioReducer = (
  state: Omit<AudioState, "isLoading">,
  action: AudioActions
) => {
  console.log("action", action);
  switch (action.type) {
    case "setTrack":
      return { ...state, track: action.payload };
    case "play":
      return { ...state, isPlaying: true };
    case "pause":
      return { ...state, isPlaying: false };
  }
};

function useAudioState() {
  const contextValue = useContext(AudioStateContext);
  if (contextValue === null) {
    throw new Error("useAudioContext must be used within an AudioProvider");
  }
  return contextValue;
}
function useAudioDispatch() {
  const dispatch = useContext(AudioDispatchContext);
  if (dispatch === null) {
    throw new Error("useAudioContext must be used within an AudioProvider");
  }
  // Memoize functions with useCallback
  const play = useCallback(() => dispatch({ type: "play" }), [dispatch]);
  const pause = useCallback(() => dispatch({ type: "pause" }), [dispatch]);
  const setTrack = useCallback(
    (track: AudioTrack | null) =>
      dispatch({ type: "setTrack", payload: track }),
    [dispatch]
  );
  return { play, pause, setTrack };
}
const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(audioReducer, {
    track: null,
    isPlaying: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["preview", state.track?.id] as const,
    queryFn: async () =>
      getTrackMetadata({
        data: {
          title: state.track!.title,
          artist: state.track!.artist,
        },
      }),
    retry: false,
    enabled: !!state.track,
    meta: { errorMessage: "Failed to load preview" },
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const controller = new AbortController();
    audio.addEventListener(
      "loadeddata",
      () => {
        dispatch({ type: "play" });
      },
      {
        signal: controller.signal,
      }
    );
    if (data?.previewUrl && audio.src != data.previewUrl) {
      audio.src = data.previewUrl;
      audio.load();
    }
    return () => controller.abort();
  }, [data?.previewUrl]);

  const stateValue = useMemo(
    () => ({ ...state, isLoading, error: error?.message ?? null }),
    [state, isLoading, error]
  );
  useEffect(() => {
    console.log("playback effect", stateValue);
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlayError = async () => {
      try {
        if (stateValue.isPlaying) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (error) {
        console.error("Audio playback error:", error);
        dispatch({ type: "pause" });
      }
    };

    handlePlayError();
  }, [stateValue.isPlaying, data?.previewUrl]);

  return (
    <AudioStateContext.Provider value={stateValue}>
      <AudioDispatchContext.Provider value={dispatch}>
        {children}
        {state.track && <audio ref={audioRef} />}
      </AudioDispatchContext.Provider>
    </AudioStateContext.Provider>
  );
};

export { useAudioState, useAudioDispatch, AudioProvider };
