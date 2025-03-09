import { db } from "~/db";
import {
  playlistExportsTable,
  playlistsTable,
  userProviderTable,
} from "~/db/schema";
import { z } from "zod";
import { eq, desc, getTableColumns } from "drizzle-orm";
import { createServerFn } from "@tanstack/start";
import { authMiddleware, sessionMiddleware } from "./middleware";
import { notFound } from "@tanstack/react-router";
import { and } from "drizzle-orm";
import { usersTable } from "~/db/schema";
import { TransferService, PlaylistService } from "~/lib/integrations/transfer";
import { spotifyAuth, SpotifyService } from "~/lib/integrations/spotify";
import { playlistUpdateSchema } from "~/lib/validators";
import { youtubeAuth, YoutubeService } from "~/lib/integrations/youtube";
import { chunk } from "~/lib/utils";
import { AppleMusicService } from "~/lib/integrations/apple";

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

export const getPlaylistByDetails = createServerFn()
  .middleware([sessionMiddleware])
  .validator(z.object({ shortcode: z.string() }))
  .handler(async ({ context: { owner }, data: { shortcode } }) => {
    const playlistRows = await db
      .select({
        ...getTableColumns(playlistsTable),
        user: getTableColumns(usersTable),
        export: getTableColumns(playlistExportsTable),
      })
      .from(playlistsTable)
      .leftJoin(usersTable, eq(playlistsTable.userId, usersTable.id))
      .leftJoin(
        playlistExportsTable,
        and(
          eq(playlistsTable.id, playlistExportsTable.playlistId),
          owner.type === "user"
            ? eq(playlistExportsTable.userId, owner.userId)
            : undefined
        )
      )
      .where(eq(playlistsTable.shortcode, shortcode));

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

export const transferPlaylist = createServerFn()
  .middleware([authMiddleware])
  .validator(z.object({ shortcode: z.string() }))
  .handler(async ({ context: { userId }, data: { shortcode } }) => {
    const playlistRows = await db
      .select({
        ...getTableColumns(playlistsTable),
        userProvider: getTableColumns(userProviderTable),
      })
      .from(playlistsTable)
      .innerJoin(
        userProviderTable,
        eq(userProviderTable.userId, playlistsTable.userId)
      )
      .where(
        and(
          eq(playlistsTable.userId, userId),
          eq(playlistsTable.shortcode, shortcode)
        )
      );

    if (!playlistRows.length) {
      throw notFound();
    }
    const { userProvider, ...playlist } = playlistRows[0];
    if (
      userProvider.tokenExpiresAt &&
      userProvider.tokenExpiresAt < new Date() &&
      userProvider.refreshToken
    ) {
      let token;
      switch (userProvider.provider) {
        case "spotify":
          token = await spotifyAuth.refreshAccessToken(
            userProvider.refreshToken
          );
          break;
        case "youtube":
          token = await youtubeAuth.refreshAccessToken(
            userProvider.refreshToken
          );
          break;
        default:
          throw new Error("Unsupported provider");
      }
      await db
        .update(userProviderTable)
        .set({
          accessToken: token.accessToken(),
          tokenExpiresAt: token.accessTokenExpiresAt(),
          refreshToken:
            "refreshToken" in token.data
              ? token.refreshToken()
              : userProvider.refreshToken,
        })
        .where(eq(userProviderTable.id, userProvider.id));
      userProvider.accessToken = token.accessToken();
      userProvider.tokenExpiresAt = token.accessTokenExpiresAt();
    }

    let musicService: PlaylistService;
    switch (userProvider.provider) {
      case "spotify": {
        musicService = new SpotifyService(userProvider.accessToken);

        break;
      }
      case "youtube": {
        musicService = new YoutubeService(userProvider.accessToken);

        break;
      }
      case "apple": {
        musicService = new AppleMusicService(userProvider.accessToken);
        // const matchResults = await musicService.findMatchingTracks(
        //   playlist.tracks.map((track) => ({
        //     title: track.title,
        //     artist: track.artist,
        //   }))
        // );
        // console.log(matchResults);
        // return;
        break;
      }
      default: {
        throw new Error("Unsupported provider");
      }
    }

    const transferService = new TransferService(musicService);
    const transferResult = await transferService.transferPlaylist({
      title: playlist.title,
      tracks: playlist.tracks,
      description: playlist.description ?? "",
    });

    const exportRow = await db
      .insert(playlistExportsTable)
      .values({
        playlistId: playlist.id,
        service: userProvider.provider,
        servicePlaylistId: transferResult.playlist.id,
        url: transferResult.playlist.url,
        userId,
      })
      .returning();

    if (!exportRow.length) {
      throw new Error("Failed to create export");
    }
    return {
      results: transferResult,
      exportId: exportRow[0],
    };
  });

export const updatePlaylist = createServerFn()
  .middleware([sessionMiddleware])
  .validator(playlistUpdateSchema.extend({ shortcode: z.string() }))
  .handler(
    async ({
      context: { owner },
      data: { shortcode, title, description, tracks },
    }) => {
      const playlistRows = await db
        .select({
          id: playlistsTable.id,
          tracks: playlistsTable.tracks,
        })
        .from(playlistsTable)
        .where(
          and(
            owner.type === "user"
              ? eq(playlistsTable.userId, owner.userId)
              : eq(playlistsTable.guestUserId, owner.guestId),
            eq(playlistsTable.shortcode, shortcode)
          )
        );
      if (!playlistRows.length) {
        throw notFound();
      }
      const { tracks: oldTracks, id } = playlistRows[0];
      await db
        .update(playlistsTable)
        .set({
          title,
          description,
          tracks: oldTracks
            .filter((t) => tracks[t.id])
            .sort((a, b) => tracks[a.id] - tracks[b.id]),
        })
        .where(eq(playlistsTable.id, id));
    }
  );

export const deleteExport = createServerFn()
  .middleware([authMiddleware])
  .validator(z.object({ exportId: z.string() }))
  .handler(async ({ context: { userId }, data: { exportId } }) => {
    const playlistRows = await db
      .select({
        playlistExport: getTableColumns(playlistExportsTable),
        userProvider: getTableColumns(userProviderTable),
      })
      .from(playlistExportsTable)
      .innerJoin(
        playlistsTable,
        eq(playlistExportsTable.playlistId, playlistsTable.id)
      )
      .innerJoin(
        userProviderTable,
        eq(userProviderTable.userId, playlistsTable.userId)
      )
      .where(
        and(
          eq(playlistExportsTable.id, exportId),
          eq(playlistsTable.userId, userId)
        )
      );

    if (!playlistRows.length) {
      throw notFound();
    }
    const { userProvider, playlistExport } = playlistRows[0];

    await db
      .delete(playlistExportsTable)
      .where(eq(playlistExportsTable.id, exportId));

    if (playlistExport.service === "spotify") {
      try {
        const spotifyService = new SpotifyService(userProvider.accessToken);
        await spotifyService.deletePlaylist(playlistExport.servicePlaylistId);
      } catch (error) {
        console.error("Failed to delete playlist from Spotify", error);
      }
    }
  });
