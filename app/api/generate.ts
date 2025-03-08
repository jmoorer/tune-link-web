import { createServerFn } from "@tanstack/start";

import { generateText, generateObject, LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { safeValidate, sessionMiddleware } from "./middleware";
import { generationInputSchema, playlistResultSchema } from "~/lib/validators";
import { nanoid } from "nanoid";
import { chunk, timePromise } from "~/lib/utils";
import fs from "fs";
import {
  findBestMatch,
  itunesSearch,
  ITunesSearchResult,
} from "~/lib/integrations/itunes";
import { EnrichedTrack, GeneratedPlaylist } from "~/lib/types";
import { playlistsTable } from "~/db/schema";
import { db } from "~/db";
import { redirect } from "@tanstack/react-router";

const instuctions = `You are a passionate music curator with extensive knowledge across all musical genres and eras. Generate a carefully curated playlist of 15 songs that perfectly match the following prompt. Each song should include the title and artist name`;

const modelMap = {
  openai: openai("gpt-4o-mini-2024-07-18"),
  gemini: google("gemini-1.5-pro") as LanguageModelV1,
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
  .middleware([sessionMiddleware])
  .handler(async ({ data: { prompt, genres }, context: { owner } }) => {
    // await testModels(prompt);

    const generateResult = await timePromise(
      () =>
        generateObject({
          model: modelMap.openai,
          system: instuctions,
          prompt: `Theme: ${prompt} ,
                   Genres: ${genres.join(", ")}`,
          schema: playlistResultSchema,
          mode: "json",
        }),
      "generatePlaylist"
    );

    let playlistResult = generateResult.object;
    const enrichedTracks = await timePromise(
      () => validateTracks(playlistResult.tracks),
      "fetchEnrichedTracks"
    );

    const playlistRows = await db
      .insert(playlistsTable)
      .values({
        title: playlistResult.title,
        description: playlistResult.description,
        tracks: enrichedTracks,
        genrationParams: {
          prompt,
          genres,
        },
        userId: owner.userId,
        guestUserId: owner.guestId,
        shortcode: nanoid(10),
      })
      .returning();
    if (playlistRows.length === 0) {
      throw new Error("Failed to create playlist");
    }
    const playlist = playlistRows[0];
    throw redirect({
      to: "/playlist/$shortcode",
      params: {
        shortcode: playlist.shortcode,
      },
    });
  });

export const validateTracks = async (tracks: GeneratedPlaylist["tracks"]) => {
  const enrichedTracks: EnrichedTrack[] = [];
  const chunks = chunk(tracks, 10);
  for (const chunk of chunks) {
    const tracks = await Promise.all(
      chunk.map(async (track) => {
        const hits = await itunesSearch(track.title, track.artist);
        const bestMatch = findBestMatch(track, hits);
        if (bestMatch && bestMatch.similarity > 0.8) {
          return {
            ...track,
            coverArt: hits[0].artworkUrl100,
            previewUrl: hits[0].previewUrl,
            album: hits[0].collectionName,
          };
        }
        console.log("No match found for", track);
        return null;
      })
    );
    enrichedTracks.push(...tracks.filter((track) => track !== null));
  }

  return enrichedTracks;
};
