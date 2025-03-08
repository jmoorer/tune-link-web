import { createServerFn } from "@tanstack/start";
import { sessionMiddleware } from "./middleware";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { usersTable, userProviderTable } from "~/db/schema";
import { z } from "zod";
import {
  appleMusicFetcher,
  generateDeveloperToken,
} from "~/lib/integrations/apple";
export const getOwner = createServerFn({})
  .middleware([sessionMiddleware])
  .handler(async ({ context: { owner } }) => {
    return owner;
  });

export const getCurrentUser = createServerFn({})
  .middleware([sessionMiddleware])
  .handler(async ({ context: { owner } }) => {
    if (!owner.userId) {
      return;
    }
    const userRow = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        avatar: usersTable.avatar,
        provider: userProviderTable.provider,
        providerId: userProviderTable.providerId,
      })
      .from(usersTable)
      .where(eq(usersTable.id, owner.userId))
      .innerJoin(
        userProviderTable,
        eq(userProviderTable.userId, usersTable.id)
      );
    return userRow.at(0);
  });

export const loginWithApple = createServerFn({})
  .middleware([sessionMiddleware])
  .validator(
    z.object({
      userToken: z.string(),
    })
  )
  .handler(async ({ context: { owner }, data: { userToken } }) => {
    const storefront = await appleMusicFetcher("/storefronts/us", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${generateDeveloperToken()}`,
        "Music-User-Token": userToken,
      },
    });
    console.log("storefront", storefront);
    return owner;
  });
