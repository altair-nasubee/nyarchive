import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

/**
 * Turso (libSQL) クライアント。
 * ローカル開発では TURSO_DATABASE_URL に `file:local.db` を指定すれば
 * トークンなしのローカル SQLite で動作する。
 */
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });

export { schema };
