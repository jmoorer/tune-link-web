import { createServerFn } from "@tanstack/start";
import { safeValidate } from "./middleware";
import { songSearchSchema } from "~/lib/validators";
import { z } from "zod";
import { itunesSearch } from "~/lib/integrations/itunes";
export const getTrackMetadata = createServerFn({ method: "POST" })
  .validator(safeValidate(songSearchSchema))
  .handler(async ({ data }) => {
    const results = await itunesSearch(data.title, data.artist);
    const result = results[0];
    if (!results.length) {
      throw new Error("Not found");
    }

    return {
      artwork: {
        small: result.artworkUrl60,
        medium: result.artworkUrl100,
        large: result.artworkUrl100.replace("100x100", "600x600"),
      },
      previewUrl: result.previewUrl,
    };
  });
