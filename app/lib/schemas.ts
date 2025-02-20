import z from "zod";
export const generationInputSchema = z.object({
  prompt: z.string().min(3).max(300),
  genres: z.string().array(),
});
