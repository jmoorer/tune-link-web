import z from "zod";
export const generationInputSchema = z.object({
  prompt: z.string().min(3).max(300),
  genres: z.string().array(),
});

export const playlistResultSchema = z.object({
  title: z.string(),
  tracks: z
    .object({
      title: z.string().min(1),
      artist: z.string().min(1),
      duration: z.number().positive(),
    })
    .array(),
});
