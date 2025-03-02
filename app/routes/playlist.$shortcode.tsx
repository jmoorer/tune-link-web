import { useMutation, useQuery } from "@tanstack/react-query";
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
import {
  AudioProvider,
  useAudioState,
  useAudioDispatch,
} from "~/context/audio-context";
import { EnrichedTrack, PlaylistDetails } from "~/lib/types";
import { getPlaylistByShortcode, deletePlaylist } from "~/api/playlist";

export const Route = createFileRoute("/playlist/$shortcode")({
  component: RouteComponent,
  loader: async ({ params }) =>
    getPlaylistByShortcode({ data: { shortcode: params.shortcode } }),
});

function RouteComponent() {
  const playlist = Route.useLoaderData();

  const [editMode, toggleEditMode] = useToggle();
  const mainref = useRef<HTMLElement>(null);

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
        <AudioProvider>
          <Details playlist={playlist} onEditMode={toggleEditMode} />
        </AudioProvider>
      )}
    </Main>
  );
}

const Details = ({
  playlist,
  onEditMode,
}: {
  playlist: PlaylistDetails;
  onEditMode: () => void;
}) => {
  const duration = playlist.tracks.reduce(
    (sum, track) => track.duration + sum,
    0
  );

  const navigate = useNavigate();

  const deletePlaylistMutation = useMutation({
    mutationFn: () =>
      deletePlaylist({ data: { shortcode: playlist.shortcode } }),
    onSuccess: () => {
      navigate({ to: "/" });
    },
    meta: {
      errorMessage: "Failed to delete playlist",
    },
  });

  const [Dialog, [, toggle]] = useConfirmation({
    title: "Delete playlist",
    description:
      "Are you sure you want to delete this playlist? This action cannot be undone.",
    onConfirm: async () => {
      await deletePlaylistMutation.mutateAsync();
    },
  });

  const user = useAppUser();

  const state = useAudioState();
  const actions = useAudioDispatch();
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
                  <Button>Save to Spotify</Button>
                ) : (
                  <Button>
                    <LogInIcon /> Login to Save
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
                  {deletePlaylistMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Trash />
                      <span className="hidden sm:block"> Delete</span>
                    </>
                  )}
                </Button>
                <Dialog />
              </div>
            </div>
          </div>

          {!user && (
            <Alert variant="info">
              <AlertTitle>Login to Save</AlertTitle>
              <AlertDescription>
                Login to save your playlist to your streaming service.
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
                <PlayButton track={track} />

                <img
                  src={track.coverArt ?? "https://via.placeholder.com/150"}
                  className="w-10 h-10 rounded-md"
                  alt={track.title}
                />

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
      {state.track && <PreviewPlayer />}
    </>
  );
};
const PlayButton = ({ track }: { track: EnrichedTrack }) => {
  const state = useAudioState();
  const actions = useAudioDispatch();

  return (
    <Button
      onClick={() => {
        // if (state.isLoading) return;
        if (state.track?.id === track.id) {
          state.isPlaying ? actions.pause() : actions.play();
        } else {
          actions.setTrack({
            ...track,
          });
        }
      }}
      variant="outline"
      size="icon"
      className={cn(
        "rounded-full border-2",
        state.track?.id === track.id && "border-primary text-primary"
      )}
    >
      {state.track?.id === track.id && state.isPlaying ? <Pause /> : <Play />}
    </Button>
  );
};
const PreviewPlayer = () => {
  const { isPlaying, track } = useAudioState();
  const actions = useAudioDispatch();

  const togglePlay = async () => {
    try {
      if (isPlaying) {
        actions.pause();
      } else {
        actions.play();
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50  border-t bg-background/90 backdrop-blur-sm">
      <div className=" container mx-auto px-2 py-2  gap-2  flex items-center justify-between  ">
        <img
          src={track.coverArt ?? "https://via.placeholder.com/150"}
          className="w-10 h-10 rounded-md"
          alt={track.title}
        />
        <div className="flex flex-col flex-1">
          <span> {track.title}</span>
          <span> {track.artist}</span>
        </div>
        {/* {isLoading && <Loader2 className="animate-spin" />}
        {error && <CircleAlertIcon className=" text-destructive" />} */}

        <div>
          <Button onClick={togglePlay} variant="ghost" size="icon">
            {isPlaying ? <Pause /> : <Play />}
          </Button>
        </div>

        <Button
          onClick={() => actions.setTrack(null)}
          variant="ghost"
          size="icon"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
