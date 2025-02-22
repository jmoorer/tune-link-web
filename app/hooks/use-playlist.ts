import { useLiveQuery } from "dexie-react-hooks";
import { db } from "~/db/local";

export const usePlaylist = (shortcode: string) => {
  return useLiveQuery(async () => {
    const playlist = await db.playlist.get({
      shortcode,
    });

    return playlist;
  }, [shortcode]);
};
