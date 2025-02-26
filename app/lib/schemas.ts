import z from "zod";

export const ProviderTypeSchema = z.enum(["spotify"]);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;
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
    })
    .array(),
});
export const songSearchSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
});
