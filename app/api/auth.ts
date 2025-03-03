import { createServerFn } from "@tanstack/start";
import { sessionMiddleware } from "./middleware";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { usersTable, userProviderTable } from "~/db/schema";

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
        provider: userProviderTable.provider,
      })
      .from(usersTable)
      .where(eq(usersTable.id, owner.userId))
      .innerJoin(
        userProviderTable,
        eq(userProviderTable.userId, usersTable.id)
      );
    return userRow.at(0);
  });
