import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/db/schema";

/**
 * 結合テスト用のインメモリ libSQL。
 * 本番と同じ Drizzle スキーマ（drizzle/ のマイグレーションSQL）を適用して使う。
 * `@/lib/db` をこの `testDb` にモックすることで、queries / actions を実DB相当で検証する。
 */
const client = createClient({ url: ":memory:" });
export const testDb = drizzle(client, { schema });
export { schema };

let applied = false;

/** drizzle/ のマイグレーションSQLをインメモリDBに適用する（初回のみ）。 */
export async function applySchema(): Promise<void> {
  if (applied) return;
  await client.execute("PRAGMA foreign_keys = ON;");

  const dir = path.resolve(process.cwd(), "drizzle");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(path.join(dir, file), "utf8");
    for (const stmt of sql.split("--> statement-breakpoint")) {
      const s = stmt.trim();
      if (s) await client.execute(s);
    }
  }
  applied = true;
}

/** 各テスト間で全テーブルを空にする。 */
export async function resetDb(): Promise<void> {
  await client.execute("PRAGMA foreign_keys = OFF;");
  for (const table of [
    "cat_images",
    "cats",
    "verification",
    "session",
    "account",
    "user",
  ]) {
    await client.execute(`DELETE FROM ${table};`);
  }
  // autoincrement のカウンタもリセット
  await client.execute("DELETE FROM sqlite_sequence;").catch(() => {});
  await client.execute("PRAGMA foreign_keys = ON;");
}

/* ----------------------------- seed helpers ----------------------------- */

export async function seedUser(user: {
  id: string;
  name: string;
  email: string;
}): Promise<void> {
  await testDb.insert(schema.user).values(user);
}

export async function seedCat(cat: {
  name: string;
  ownerId: string;
  iconUrl?: string | null;
  iconPathname?: string | null;
  breed?: string | null;
  birthDate?: Date | null;
}): Promise<number> {
  const [row] = await testDb
    .insert(schema.cats)
    .values(cat)
    .returning({ id: schema.cats.id });
  return row.id;
}

export async function seedImage(image: {
  catId: number;
  url: string;
  pathname: string;
  isPublic: boolean;
}): Promise<number> {
  const [row] = await testDb
    .insert(schema.catImages)
    .values(image)
    .returning({ id: schema.catImages.id });
  return row.id;
}
