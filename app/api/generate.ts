import { createServerFn } from "@tanstack/start";

import { generateText, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { safeValidate } from "./middleware";
import { generationInputSchema, playlistResultSchema } from "~/lib/schemas";
import { nanoid } from "nanoid";
const instuctions =
  "you are to act as a music recomender. I will give you  words and you will generate a 15 track playlist. you  should convert it into the given structure as json";

export const generatePlaylist = createServerFn({ method: "POST" })
  .validator(safeValidate(generationInputSchema))
  .handler(async ({ data: { prompt } }) => {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      system: instuctions,
      prompt,
      schema: playlistResultSchema,
      mode: "json",
    });

    return {
      ...result.object,
      shortcode: nanoid(10),
    };
  });
