import React from "react";
import { GeneratedPlaylist } from "~/db/local";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { cn, formatMediaDuration } from "~/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormLabel } from "./form-label";
import { GripVerticalIcon } from "lucide-react";
import SortableList from "../drag/SortableList";
import { useForm } from "@tanstack/react-form";

interface Props {
  playlist: GeneratedPlaylist;
  onEndEdit: () => void;
}

const EditForm = ({ playlist, onEndEdit }: Props) => {
  const { Field } = useForm({
    defaultValues: {
      tracks: playlist.tracks.map((tr, index) => ({
        ...tr,
        id: tr.artist,
      })),
    },
  });
  return (
    <>
      <Card fullscreen>
        <CardHeader className="">
          <FormLabel label="Title">
            <Input className="text-2xl" value={playlist.title} />
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
                  renderItem={(track, { listeners, handleRef }) => (
                    <div className="px-3 py-2 border bg-background  rounded  flex items-center gap-2">
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
      <div className="border-t  px-6 py-2 absolute  flex items-center justify-between bg-background  bottom-0 left-0 right-0 ">
        <Button onClick={onEndEdit} variant="secondary">
          Cancel
        </Button>
        <Button>Save</Button>
      </div>
    </>
  );
};

export default EditForm;
