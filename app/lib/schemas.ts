import z from "zod";
export const generationInputSchema = z.object({
  prompt: z.string().min(3).max(300),
  genres: z.string().array(),
});

export const playlistResultSchema = z.object({
  title: z.string(),
  tracks: z
    .object({
      position: z.number({ description: "Track position" }),
      title: z.string().min(1),
      artist: z.string().min(1),
      featureArtist: z.string().array(),
      duration: z.number().positive(),
    })
    .array(),
});
export const songSearchSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
});
