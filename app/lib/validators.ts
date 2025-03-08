import z from "zod";

export const providerTypeSchema = z.enum(["spotify", "youtube", "apple"]);
export const generationInputSchema = z.object({
  prompt: z.string().min(3).max(300),
  genres: z.string().array(),
});

export const playlistResultSchema = z.object({
  title: z.string(),
  description: z.string(),
  tracks: z
    .object({
      id: z.string({
        description: "5 digit nanoid",
      }),
      position: z.number({ description: "Track position" }),
      title: z.string().min(1),
      artist: z.string({ description: "Primary artist" }).min(1),
      featureArtist: z.string().array(),
      duration: z.number({ description: "Duration in seconds" }).positive(),
      coverArt: z.string().optional(),
      previewUrl: z.string().optional(),
    })
    .array(),
});
export const playlistUpdateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tracks: z.record(z.string(), z.number()),
});
export const songSearchSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
});
