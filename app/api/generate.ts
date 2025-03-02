import { createServerFn } from "@tanstack/start";

import { generateText, generateObject, LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { safeValidate, sessionMiddleware } from "./middleware";
import { generationInputSchema, playlistResultSchema } from "~/lib/validators";
import { nanoid } from "nanoid";
import { chunk, timePromise } from "~/lib/utils";
import fs from "fs";
import { itunesSearch, ITunesSearchResult } from "~/lib/integrations/itunes";
import { EnrichedTrack, GeneratedPlaylist } from "~/lib/types";
import { playlistsTable } from "~/db/schema";
import { db } from "~/db";
import { redirect } from "@tanstack/react-router";
import {
  calculateContainment,
  normalizeString,
  tokenSetSimilarity,
} from "~/lib/util/stringUtils";
import { jaroWinklerSimilarity } from "~/lib/util/stringUtils";
const instuctions =
  "you are to act as a music recomender. I will give you  words and you will generate a 15 track playlist. you  should convert it into the given structure as json";

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
  .handler(async ({ data: { prompt }, context: { owner } }) => {
    // await testModels(prompt);

    const generateResult = await timePromise(
      () =>
        generateObject({
          model: modelMap.gemini,
          system: instuctions,
          prompt,
          schema: playlistResultSchema,
          mode: "json",
        }),
      "generatePlaylist"
    );

    let playlistResult = generateResult.object;
    const enrichedTracks = await timePromise(
      () => fetchEnrichedTracks(playlistResult.tracks),
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
          genres: [],
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

const fetchEnrichedTracks = async (tracks: GeneratedPlaylist["tracks"]) => {
  const enrichedTracks: EnrichedTrack[] = [];
  const chunks = chunk(tracks, 10);
  for (const chunk of chunks) {
    const tracks = await Promise.all(
      chunk.map(async (track) => {
        const hits = await itunesSearch(track.title, track.artist);
        const bestMatch = findBestMatch(track, hits);
        if (bestMatch) {
          return {
            ...track,
            coverArt: hits[0].artworkUrl100,
            previewUrl: hits[0].previewUrl,
            album: hits[0].collectionName,
          };
        }
        return {
          ...track,
          coverArt: "https://placehold.co/100x100",
          previewUrl: undefined,
          album: undefined,
        };
      })
    );
    enrichedTracks.push(...tracks);
  }
  return enrichedTracks;
};

function findBestMatch(
  originalTrack: { title: string; artist: string },
  itunesResults: ITunesSearchResult[]
) {
  if (!itunesResults || itunesResults.length === 0) return null;

  const titleWeight = 0.6;
  const artistWeight = 0.4;
  const minConfidenceThreshold = 0.5;

  const originalTitleNorm = normalizeString(originalTrack.title);
  const originalArtistNorm = normalizeString(originalTrack.artist);

  const scoredResults = itunesResults.map((result) => {
    const resultTitleNorm = normalizeString(result.trackName);
    const resultArtistNorm = normalizeString(result.artistName);

    // 1. Calculate Jaro-Winkler similarity (better for short strings like titles)
    const titleJaroSimilarity = jaroWinklerSimilarity(
      originalTitleNorm,
      resultTitleNorm
    );
    const artistJaroSimilarity = jaroWinklerSimilarity(
      originalArtistNorm,
      resultArtistNorm
    );

    // 2. Check for title contained in each other
    const titleContainment = calculateContainment(
      originalTitleNorm,
      resultTitleNorm
    );

    // 3. Token set similarity (for cases where word order differs)
    const titleTokenSimilarity = tokenSetSimilarity(
      originalTitleNorm,
      resultTitleNorm
    );
    const artistTokenSimilarity = tokenSetSimilarity(
      originalArtistNorm,
      resultArtistNorm
    );

    // Calculate weighted title score
    const titleScore =
      titleJaroSimilarity * 0.5 +
      titleContainment * 0.3 +
      titleTokenSimilarity * 0.2;

    // Calculate weighted artist score
    const artistScore =
      artistJaroSimilarity * 0.6 + artistTokenSimilarity * 0.4;

    // Combined weighted score
    const score = titleScore * titleWeight + artistScore * artistWeight;

    // Add bonus for exact title match
    const exactTitleBonus = resultTitleNorm === originalTitleNorm ? 0.1 : 0;

    // Final confidence score (0-1 range)
    const confidence = Math.min(1, score + exactTitleBonus);

    return {
      result,
      confidence,
      metrics: {
        titleJaro: titleJaroSimilarity,
        artistJaro: artistJaroSimilarity,
        titleContainment,
        titleToken: titleTokenSimilarity,
        artistToken: artistTokenSimilarity,
      },
    };
  });

  // Sort by score (lower is better) and get best match
  scoredResults.sort((a, b) => b.confidence - a.confidence);

  if (
    scoredResults.length > 0 &&
    scoredResults[0].confidence >= minConfidenceThreshold
  ) {
    return scoredResults[0];
  }

  // If the best match is too poor, return null

  console.log("--------------------------------");
  console.log({
    originalTitle: originalTrack.title,
    originalArtist: originalTrack.artist,
    bestMatch: scoredResults[0]?.result,
    confidence: scoredResults[0]?.confidence,
    metrics: scoredResults[0]?.metrics,
    scoredResults,
  });
  console.log("--------------------------------");
  return null;
}
