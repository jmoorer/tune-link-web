import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { GenerationParams, PlaylistResult } from "~/lib/types";

export const providerEnum = pgEnum("provider", ["spotify"]);

export const usersTable = pgTable("users", {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar({ length: 255 }).notNull(),
  avatar: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
});

export const userProviderTable = pgTable("user_providers", {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  provider: providerEnum("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
});

export const playlistsTable = pgTable("playlists", {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar({ length: 255 }).notNull(),
  tracks: jsonb("tracks").notNull().$type<PlaylistResult["tracks"]>(),
  shortcode: varchar({ length: 255 }).notNull(),
  genrationParams: jsonb("genration_params").$type<GenerationParams>(),
  description: text("description"),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  guestUserId: uuid("guest_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const playlistExportsTable = pgTable("playlist_exports", {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  playlistId: uuid("playlist_id")
    .notNull()
    .references(() => playlistsTable.id, { onDelete: "cascade" }),
  service: providerEnum("service").notNull(),
  servicePlaylistId: varchar("service_playlist_id", { length: 255 }).notNull(),
  exportedAt: timestamp("exported_at").notNull().defaultNow(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, {
      onDelete: "cascade",
    }),
  url: text("url").notNull(),
});
