import { useLiveQuery } from "dexie-react-hooks";
import { indexDb } from "~/db/appDb";

export const usePlaylist = (shortcode: string) => {
  return useLiveQuery(async () => {
    const playlist = await indexDb.playlist.get({
      shortcode,
    });

    return playlist;
  }, [shortcode]);
};
