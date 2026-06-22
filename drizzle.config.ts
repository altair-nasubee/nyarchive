import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit は .env.local を自動で読まないため、Next.js と同じ順序で読み込む
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    // ローカルの file: DB では token 不要。空文字は turso ダイアレクトが弾くため undefined に正規化
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  },
  verbose: true,
  strict: true,
});
