import { createServerFn } from "@tanstack/start";
import { sessionMiddleware } from "./middleware";
import { db } from "~/db";
import { eq } from "drizzle-orm";

export const getCurrentUser = createServerFn({})
  .middleware([sessionMiddleware])
  .handler(async ({ context: { userId } }) => {
    const userRow = await db.query.usersTable.findFirst({
      where: (t) => eq(t.id, userId),
    });
    return userRow;
  });
