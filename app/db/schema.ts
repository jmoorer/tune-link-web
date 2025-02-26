import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { ProviderTypeSchema } from "~/lib/schemas";

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
  //     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  //   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  //   provider_id INTEGER NOT NULL REFERENCES auth_providers(id),
  //   provider_user_id VARCHAR(255) NOT NULL,
  //   access_token TEXT,
  //   refresh_token TEXT,
  //   token_expires_at TIMESTAMP WITH TIME ZONE,
  id: uuid()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  provider: providerEnum(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  //   email: varchar({ length: 255 }),
});
