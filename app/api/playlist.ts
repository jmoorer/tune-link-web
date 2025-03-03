import { db } from "~/db";
import { playlistsTable } from "~/db/schema";
import { z } from "zod";
import { eq, desc, getTableColumns } from "drizzle-orm";
import { createServerFn } from "@tanstack/start";
import { sessionMiddleware } from "./middleware";
import { notFound } from "@tanstack/react-router";
import { and } from "drizzle-orm";
import { usersTable } from "~/db/schema";
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
    const playlistRows = await db
      .select({
        ...getTableColumns(playlistsTable),
        user: getTableColumns(usersTable),
      })
      .from(playlistsTable)
      .leftJoin(usersTable, eq(playlistsTable.userId, usersTable.id))
      .where(eq(playlistsTable.shortcode, shortcode));
    //       await db.query.playlistsTable.findFirst({
    //   where: eq(playlistsTable.shortcode, shortcode),
    // });

    if (!playlistRows.length) {
      throw notFound();
    }

    const { user, ...playlist } = playlistRows[0];
    const playlistOwner: { name: string; id: string; avatar?: string } = user
      ? { name: user.name, id: user.id, avatar: user.avatar }
      : { name: "Guest", id: playlist.guestUserId ?? "" };
    return {
      ...playlist,
      owner: playlistOwner,
    };
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
