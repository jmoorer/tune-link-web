import { createServerFn } from "@tanstack/start";

import { generateText, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { safeValidate } from "./middleware";
import { generationInputSchema, playlistResultSchema } from "~/lib/schemas";
import { nanoid } from "nanoid";
import { timePromise } from "~/lib/utils";
import fs from "fs";
const instuctions =
  "you are to act as a music recomender. I will give you  words and you will generate a 15 track playlist. you  should convert it into the given structure as json";

const modelMap = {
  openai: openai("gpt-4o-mini-2024-07-18"),
  anthropic: openai("claude-3-5-sonnet-20240620"),
  groq: openai("llama-3.1-70b-versatile"),
  gemini: openai("gemini-1.5-flash"),
  ollama: openai("llama3.1"),
};
const testModels = async (prompt: string) => {
  const writeFile = fs.createWriteStream("results.txt");
  const results = await Promise.all(
    Object.entries(modelMap).map(async ([key, model]) => {
      try {
        const result = await timePromise(
          () =>
            generateObject({
              model,
              system: instuctions,
              prompt,
              schema: playlistResultSchema,
              mode: "json",
            }),
          `testModels ${key}`
        );
        writeFile.write("--------------------------------\n");
        writeFile.write(
          `Model ${key}: ${JSON.stringify(result.object, null, 2)}\n`
        );
        writeFile.write("--------------------------------\n");
        return result;
      } catch (error) {
        writeFile.write("--------------------------------\n");
        writeFile.write(
          `Model ${key}: Failed to generate playlist with model ${error}\n`
        );
        writeFile.write("--------------------------------\n");
        console.error("Failed to generate playlist with model", key, error);
        return null;
      }
    })
  );
  return results;
};

export const generatePlaylist = createServerFn({ method: "POST" })
  .validator(safeValidate(generationInputSchema))
  .handler(async ({ data: { prompt } }) => {
    // await testModels(prompt);

    const result = await timePromise(
      () =>
        generateObject({
          model: openai("gpt-4o-mini-2024-07-18"),
          system: instuctions,
          prompt,
          schema: playlistResultSchema,
          mode: "json",
        }),
      "generatePlaylist"
    );

    return {
      ...result.object,
      shortcode: nanoid(10),
    };
  });
