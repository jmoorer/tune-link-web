import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { itunesSearch, findBestMatch } from "~/lib/integrations/itunes";

const testSong = {
  title: "Smells Like Teen Spirit",
  artist: "Nirvana",
};
export const APIRoute = createAPIFileRoute("/api/match")({
  POST: async ({ request, params }) => {
    const { title, artist } = await request.json();
    const hits = await itunesSearch(title, artist);
    const bestMatch = findBestMatch({ title, artist }, hits);
    return json({ bestMatch, hits });
  },
});
