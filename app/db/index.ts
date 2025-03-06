import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { env } from "~/env";
import * as schema from "./schema";
export const db = drizzle(env.DATABASE_URL, { schema });

migrate(db, { migrationsFolder: "./drizzle" })
  .then(() => {
    console.log("Migrations applied");
  })
  .catch((err) => {
    console.error("Error applying migrations", err);
  });
