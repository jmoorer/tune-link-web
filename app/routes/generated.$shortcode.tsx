import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from "@tanstack/react-router";
import {
  CircleAlertIcon,
  Clock,
  Loader2,
  LogInIcon,
  Music,
  Pause,
  Pen,
  Play,
  Trash,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bulkGetTrackMetadata, getTrackMetadata } from "~/api/lookup";
import { useConfirmation } from "~/components/dialog/confirmation";
import EditForm from "~/components/forms/edit-form";
import { Main } from "~/components/main";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { indexDb, GeneratedPlaylist } from "~/db/appDb";
import { usePlaylist } from "~/hooks/use-playlist";
import { useToggle } from "~/hooks/use-toggle";
import { useAppUser } from "~/hooks/useAppUser";
import { unicodes } from "~/lib/unicodes";
import { cn, formatMediaDuration } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
export const Route = createFileRoute("/generated/$shortcode")({
  component: RouteComponent,
  loader: async ({ params, parentMatchPromise }) => {},
});

function RouteComponent() {
  const user = useAppUser();
  console.log("user", { user });
  const { shortcode } = Route.useParams();

  const playlist = usePlaylist(shortcode);
  const [editMode, toggleEditMode] = useToggle();
  const mainref = useRef<HTMLElement>(null);

  if (!playlist) {
    return <>Not found</>;
  }
  console.log({ playlist });
  return (
    <Main ref={mainref} className="px-0 sm:px-8 pb-14 ">
      {editMode ? (
        <EditForm
          playlist={playlist}
          onEndEdit={() => {
            toggleEditMode();
            mainref.current?.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <Details playlist={playlist} onEditMode={toggleEditMode} />
      )}
    </Main>
  );
}

const Details = ({
  playlist,
  onEditMode,
}: {
  playlist: GeneratedPlaylist;
  onEditMode: () => void;
}) => {
  const duration = playlist.tracks.reduce(
    (sum, track) => track.duration + sum,
    0
  );
  const { data: trackMap } = useQuery({
    queryKey: ["trackMap", playlist?.id],
    queryFn: async () =>
      bulkGetTrackMetadata({
        data: playlist?.tracks ?? [],
      }),
  });
  const navigate = useNavigate();
  const [previewTrack, setPreviewTrack] =
    useState<GeneratedPlaylist["tracks"][number]>();

  const [Dialog, [, toggle]] = useConfirmation({
    title: "Delete playlist",
    description:
      "Are you sure you want to delete this playlist? This action cannot be undone.",
    onConfirm: async () => {
      await indexDb.playlist.delete(playlist.id);
      navigate({ to: "/" });
    },
  });

  const user = useAppUser();
  console.log({ trackMap });
  return (
    <>
      <Card fullscreen>
        <CardHeader className=" relative gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center text-center sm:text-left">
            <div className="w-48 h-48 flex-shrink-0 bg-primary/20 rounded-lg shadow-md flex items-center justify-center">
              <Music size={64} className="text-primary" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <CardTitle className="text-3xl">{playlist.title}</CardTitle>
              <CardDescription>
                <span>{playlist.description}</span>
              </CardDescription>
              <span className="flex gap-2 sm:justify-start justify-center">
                <Badge variant="secondary">
                  <Music className="mr-2" size={16} />
                  {playlist.tracks.length} tracks
                </Badge>
                <Badge variant="secondary">
                  <Clock className="mr-2" size={16} />
                  {formatMediaDuration(duration, "full")}
                </Badge>
              </span>
              <div className="flex items-center pt-6  sm:justify-start justify-center gap-2">
                {user ? (
                  <Button>Export to Service</Button>
                ) : (
                  <Button>
                    <LogInIcon /> Login to Export
                  </Button>
                )}
                <Button onClick={onEditMode} variant="secondary">
                  <Pen />
                  Edit
                </Button>
                <Button
                  onClick={toggle}
                  variant="outline"
                  size="iconText"
                  className=""
                >
                  <Trash />
                  <span className="hidden sm:block"> Delete</span>
                </Button>
                <Dialog />
              </div>
            </div>
          </div>

          {!user && (
            <Alert variant="info">
              <AlertTitle>Login to Export</AlertTitle>
              <AlertDescription>
                Login to export your playlist to your favorite music service.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="flex-1 ">
          <div className="  space-y-3 rounded">
            {playlist.tracks.map((track) => (
              <div
                key={track.id}
                className="px-3 py-2 border bg-background  rounded  flex items-center gap-2"
              >
                <img
                  src={
                    trackMap?.[track.id]?.artworkUrl100 ??
                    "https://via.placeholder.com/150"
                  }
                  className="w-10 h-10 rounded-md"
                  alt={track.title}
                />

                <Button
                  onClick={() => setPreviewTrack(track)}
                  variant="ghost"
                  size="icon"
                >
                  <Play />
                </Button>
                <div className="flex flex-col flex-1">
                  <span>{track.title}</span>
                  <span className="text-muted-foreground">{track.artist}</span>
                </div>

                <span className="text-muted-foreground">
                  {formatMediaDuration(track.duration)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {previewTrack && (
        <PreviewButtonPlayer
          onClose={() => setPreviewTrack(undefined)}
          track={previewTrack}
        />
      )}
    </>
  );
};

const PreviewButtonPlayer = ({
  track,
  onClose,
}: {
  track: GeneratedPlaylist["tracks"][number];
  onClose: () => void;
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [track.title, track.artist],
    queryFn: async () =>
      getTrackMetadata({
        data: {
          title: track.title,
          artist: track.artist,
        },
      }),
    retry: false,
    meta: { errorMessage: "Failed to load preview" },
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadAudio = async () => {
      if (
        audioRef.current &&
        !!data &&
        audioRef.current.src != data.previewUrl
      ) {
        audioRef.current.src = data.previewUrl;
        audioRef.current.load(); // Preload the audio
        audioRef.current.addEventListener(
          "loadeddata",
          () => {
            togglePlay();
          },
          {
            signal: controller.signal,
          }
        );
      }
    };

    loadAudio();
    return () => {
      controller.abort();
    };
  }, [data]);

  console.log({ error, isLoading, data });
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const controller = new AbortController();
    audio.addEventListener("timeupdate", () => {}, {
      signal: controller.signal,
    });
    audio.addEventListener("loadedmetadata", () => {}, {});
    audio.addEventListener(
      "ended",
      () => {
        setIsPlaying(false);
      },
      {
        signal: controller.signal,
      }
    );
    audio.addEventListener("error", () => {});
    return () => controller.abort();
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="border-t  px-6 py-2 absolute  flex items-center justify-between bg-background  bottom-0 left-0 right-0 ">
      <audio ref={audioRef} preload="metadata" />
      <div className="flex flex-col flex-1">
        <span> {track.title}</span>
        <span> {track.artist}</span>
      </div>
      {isLoading && <Loader2 className="animate-spin" />}
      {error && <CircleAlertIcon className=" text-destructive" />}

      {data?.previewUrl && (
        <div>
          <Button onClick={togglePlay} variant="ghost" size="icon">
            {isPlaying ? <Pause /> : <Play />}
          </Button>
        </div>
      )}
      <Button onClick={onClose} variant="ghost" size="icon">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
