import { Textarea } from "../ui/textarea";
import { genreList } from "~/lib/ontology";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ChevronDown, LoaderCircle, X } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { generationInputSchema } from "~/lib/schemas";
import { indexBy } from "~/lib/utils";
import { generatePlaylist } from "~/api/generate";
import { db } from "~/db/local";
import { FieldError } from "./field-error";

const genreIndex = indexBy(genreList, (g) => g.id);
const GenerationForm = () => {
  const { Field, Subscribe, handleSubmit, ...form } = useForm({
    defaultValues: {
      prompt: "",
      genres: [],
    },
    validators: {
      onSubmit: generationInputSchema,
    },
    onSubmitInvalid(props) {
      console.log("invalid", props);
    },
    onSubmit: async ({ value }) => {
      const result = await generatePlaylist({ data: value });
      console.log({ result });
      const id = await db.playlist.add(result);

      const lists = await db.playlist.toArray();
      console.log({ lists, id });
      form.reset();
    },
  });

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
        <div className="px-4 pt-3 pb-1">
          <Field
            name="prompt"
            children={(field) => (
              <>
                <Textarea
                  rows={4}
                  placeholder="Describe your playlist"
                  className="border-none shadow-none focus-visible:outline-none focus-visible:ring-0 resize-none"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </>
            )}
          />
        </div>

        <Field
          name="genres"
          mode="array"
          children={(field) =>
            field.state.value.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1">
                {field.state.value.map((genre, index) => (
                  <div
                    key={genre + index}
                    onClick={() => field.removeValue(index)}
                    className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    {genreIndex[genre]?.name}
                    <X className="h-4 w-4 " />
                  </div>
                ))}
              </div>
            )
          }
        />

        <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size={"sm"}>
                Choose genres
                <ChevronDown className={`ml-2 h-4 w-4 `} />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Field
                name="genres"
                mode="array"
                children={(field) => (
                  <div className="grid grid-cols-3 gap-2">
                    {genreList.slice(0, 15).map((genre) => {
                      const index = field.state.value.indexOf(genre.id);
                      const isSelected = index >= 0;
                      return (
                        <Button
                          size="sm"
                          key={`${genre.id}-option`}
                          variant={isSelected ? "default" : "ghost"}
                          onClick={() => {
                            if (isSelected) {
                              field.removeValue(index);
                            } else {
                              field.pushValue(genre.id);
                            }
                          }}
                        >
                          {genre.name}
                        </Button>
                      );
                    })}
                  </div>
                )}
              />
            </PopoverContent>
          </Popover>
          <Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                Generate Playlist
                {isSubmitting && <LoaderCircle className="animate-spin" />}
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default GenerationForm;
