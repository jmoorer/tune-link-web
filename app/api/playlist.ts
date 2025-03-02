import { db } from "~/db";
import { playlistsTable } from "~/db/schema";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createServerFn } from "@tanstack/start";
import { sessionMiddleware } from "./middleware";
import { notFound } from "@tanstack/react-router";
import { and } from "drizzle-orm";
export const getRecentPlaylists = createServerFn()
  .middleware([sessionMiddleware])
  .handler(async ({ context: { owner } }) => {
    const playlists = await db.query.playlistsTable.findMany({
      where:
        owner.type === "user"
          ? eq(playlistsTable.userId, owner.userId)
          : eq(playlistsTable.guestUserId, owner.guestId),
      orderBy: desc(playlistsTable.createdAt),
      limit: 6,
    });
    return playlists;
  });

export const getPlaylistByShortcode = createServerFn()
  .middleware([sessionMiddleware])
  .validator(z.object({ shortcode: z.string() }))
  .handler(async ({ context: { owner }, data: { shortcode } }) => {
    const playlist = await db.query.playlistsTable.findFirst({
      where: eq(playlistsTable.shortcode, shortcode),
    });
    if (!playlist) {
      throw notFound();
    }
    return playlist;
  });

export const deletePlaylist = createServerFn()
  .middleware([sessionMiddleware])
  .validator(z.object({ shortcode: z.string() }))
  .handler(async ({ context: { owner }, data: { shortcode } }) => {
    await db
      .delete(playlistsTable)
      .where(
        and(
          owner.type === "user"
            ? eq(playlistsTable.userId, owner.userId)
            : eq(playlistsTable.guestUserId, owner.guestId),
          eq(playlistsTable.shortcode, shortcode)
        )
      );
  });
