import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CircleAlertIcon,
  ExpandIcon,
  Loader2,
  Pause,
  Pen,
  Play,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getTrackMetadata } from "~/api/lookup";
import { Main } from "~/components/main";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { GeneratedPlaylist } from "~/db/local";
import { usePlaylist } from "~/hooks/use-playlist";
import { unicodes } from "~/lib/unicodes";
import { cn, formatMediaDuration } from "~/lib/utils";

export const Route = createFileRoute("/p/$shortcode")({
  component: RouteComponent,
  // loader:({params})=>
});

const cardClass = cn("border-0 shadow-none sm:border ");
function RouteComponent() {
  const { shortcode } = Route.useParams();

  const {} = useQuery({
    queryKey: [],
    queryFn: async () => 0,
  });
  const playlist = usePlaylist(shortcode);
  if (!playlist) {
    return <>Not found</>;
  }
  const duration = playlist.tracks.reduce(
    (sum, track) => track.duration + sum,
    0
  );

  return (
    <Main className="px-0 sm:px-8 pb-14 " scrollable>
      <Details playlist={playlist} />
    </Main>
  );
}

const Details = ({ playlist }: { playlist: GeneratedPlaylist }) => {
  const duration = playlist.tracks.reduce(
    (sum, track) => track.duration + sum,
    0
  );
  const [previewTrack, setPreviewTrack] =
    useState<GeneratedPlaylist["tracks"][number]>();
  return (
    <>
      <Card className={cardClass}>
        <CardHeader className="text-center sm:text-left relative">
          <CardTitle className="text-3xl">{playlist.title}</CardTitle>
          <CardDescription>
            <span>
              {`${formatMediaDuration(duration, "full")} ${unicodes.BULLET} ${playlist.tracks.length} tracks`}
            </span>
          </CardDescription>
          {/* <Button className="absolute top-6 right-6" variant="ghost">
          <Pen />
        </Button> */}
          <div className="flex items-center pt-6  sm:justify-start justify-center gap-2">
            <Button>Export to Service</Button>{" "}
            <Button variant="secondary">Edit</Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 ">
          <div className="  space-y-3 rounded">
            {playlist.tracks.map((track) => (
              <div className="px-3 py-2 border bg-background  rounded  flex items-center gap-2">
                {/* <span className="w-6">{track.position}.</span> */}
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
