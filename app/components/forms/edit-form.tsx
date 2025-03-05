import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { cn, formatMediaDuration } from "~/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormLabel } from "./form-label";
import { GripVerticalIcon, Minus, MinusCircleIcon } from "lucide-react";
import SortableList from "../drag/SortableList";
import { useForm } from "@tanstack/react-form";
import { PlaylistDetails, PlaylistUpdate } from "~/lib/types";
import { useMutation } from "@tanstack/react-query";
import { updatePlaylist } from "~/api/playlist";
import { useRouter } from "@tanstack/react-router";
import { Textarea } from "../ui/textarea";
interface Props {
  playlist: PlaylistDetails;
  onEndEdit: () => void;
}

const EditForm = ({ playlist, onEndEdit }: Props) => {
  const router = useRouter();
  const updatePlaylistMutation = useMutation({
    mutationFn: (data: PlaylistUpdate) =>
      updatePlaylist({ data: { ...data, shortcode: playlist.shortcode } }),
    onSuccess: () => {
      router.invalidate();
      onEndEdit();
    },
  });
  const { Field, handleSubmit } = useForm({
    defaultValues: {
      title: playlist.title ?? "",
      description: playlist.description ?? "",
      tracks: playlist.tracks,
    },
    onSubmit: ({ value }) =>
      updatePlaylistMutation.mutateAsync({
        title: value.title,
        description: value.description,
        tracks: Object.fromEntries(value.tracks.map((t, i) => [t.id, i + 1])),
      }),
  });
  return (
    <>
      <Card fullscreen>
        <CardHeader className="">
          <FormLabel label="Title">
            <Field
              name="title"
              children={(field) => (
                <Input
                  className="text-2xl"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            />
          </FormLabel>
          <FormLabel label="Description">
            <Field
              name="description"
              children={(field) => (
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            />
          </FormLabel>
        </CardHeader>
        <CardContent className="flex-1 ">
          <FormLabel label="Tracks" className="  space-y-3 rounded">
            <Field
              mode="array"
              name="tracks"
              children={(field) => (
                <SortableList
                  items={field.state.value}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    const tracks = field.state.value;
                    if (!over) return;
                    if (active.id !== over.id) {
                      const activeIndex = tracks.findIndex(
                        ({ id }) => id === active.id
                      );
                      const overIndex = tracks.findIndex(
                        ({ id }) => id === over.id
                      );
                      field.moveValue(activeIndex, overIndex, {
                        dontUpdateMeta: true,
                      });
                    }
                  }}
                  renderItem={(track, { listeners, handleRef }, index) => (
                    <div className="px-3 py-2 border bg-background  rounded  flex items-center gap-2">
                      <Button
                        onClick={() => field.removeValue(index)}
                        variant="ghost"
                        size="icon"
                      >
                        <MinusCircleIcon className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <img
                          src={track.coverArt}
                          className="w-10 h-10 rounded-md"
                        />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span>{track.title}</span>
                        <span className="text-muted-foreground">
                          {track.artist}
                        </span>
                      </div>

                      <span className="text-muted-foreground">
                        {formatMediaDuration(track.duration)}
                      </span>
                      <div ref={handleRef} {...listeners}>
                        <GripVerticalIcon className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                />
              )}
            />
          </FormLabel>
        </CardContent>
      </Card>
      <div
        className="border-t '
       py-2 absolute  bg-background  bottom-0 left-0 right-0 "
      >
        <div className="px-8 container mx-auto  flex items-center justify-between">
          <Button onClick={onEndEdit} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </div>
      </div>
    </>
  );
};

export default EditForm;
