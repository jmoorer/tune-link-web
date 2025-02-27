import { createServerFn } from "@tanstack/start";
import { sessionMiddleware } from "./middleware";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { usersTable, userProviderTable } from "~/db/schema";
export const getCurrentUser = createServerFn({})
  .middleware([sessionMiddleware])
  .handler(async ({ context: { userId } }) => {
    const userRow = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        provider: userProviderTable.provider,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .innerJoin(
        userProviderTable,
        eq(userProviderTable.userId, usersTable.id)
      );
    return userRow.at(0);
  });
