import Dexie, { type EntityTable } from "dexie";
import { playlistResultSchema } from "~/lib/schemas";
import { z } from "zod";
import { env } from "~/env";

type GeneratedPlaylist = z.infer<typeof playlistResultSchema> & {
  id: string;
};

const uuidAddon = (db: Dexie) => {
  // Store original hook for chaining
  const origCreate = db.Table.prototype.add;
  const origBulkCreate = db.Table.prototype.bulkAdd;

  // Monkey patch the add() method to automatically generate UUIDs
  db.Table.prototype.add = function (item, key) {
    if (this.schema.primKey.keyPath && !key) {
      // If primary key not provided, generate UUID
      const keyPath = this.schema.primKey.keyPath;
      if (typeof keyPath === "string") {
        if (!item[keyPath]) {
          item[keyPath] = crypto.randomUUID();
        }
      }
    }
    return origCreate.call(this, item, key);
  };

  // Monkey patch the bulkAdd() method
  db.Table.prototype.bulkAdd = function (items: any[], keys: any) {
    if (this.schema.primKey.keyPath && !keys) {
      const keyPath = this.schema.primKey.keyPath;
      if (typeof keyPath === "string") {
        // Generate UUIDs for any items missing primary keys
        items = items.map((item) => {
          if (!item[keyPath]) {
            return { ...item, [keyPath]: crypto.randomUUID() };
          }
          return item;
        });
      }
    }
    return origBulkCreate.call(this, items, keys);
  };
};

class AppDb extends Dexie {
  playlist!: EntityTable<
    GeneratedPlaylist,
    "id" // primary key "id" (for the typings only)
  >;

  constructor() {
    super("tune-link-db", { addons: [uuidAddon] });
    this.version(env.PUBLIC_DB_VERSION).stores({
      playlist: "id, title", // primary key "id" (for the runtime!)
    });
  }
}

export type { GeneratedPlaylist };
export const db = new AppDb();
