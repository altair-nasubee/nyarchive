# nyarchive

飼い猫のプロフィールと写真を整理・公開・閲覧できるアーカイブ Web アプリ。

## 機能

- Google ログイン（Better Auth）
- 猫プロフィールの追加・変更・削除（複数頭対応）
- 画像のアップロード（クライアント側で WebP 圧縮）・公開／非公開切替・削除
- 飼い主ごと（縦）×猫ごと（横）に並ぶギャラリー。サムネイルクリックで拡大ポップアップ
- 管理者（`ADMIN_EMAIL`）はすべてのデータを操作可能

## 技術スタック

| 領域 | 採用 |
| --- | --- |
| Frontend / Backend | Next.js 16 App Router + React 19 + TypeScript |
| スタイリング | Tailwind CSS v4 + shadcn/ui（Base UI）|
| アニメーション | Framer Motion |
| 認証 | Better Auth（Google OAuth）|
| DB | Turso (libSQL/SQLite) + Drizzle ORM |
| ストレージ | Vercel Blob |
| 画像圧縮 | browser-image-compression（クライアント・WebP）|

## セットアップ

```bash
pnpm install
cp .env.example .env.local   # 値を埋める
pnpm db:migrate              # ローカル: file:local.db にスキーマ適用
pnpm dev
```

### 環境変数（`.env.example` 参照）

- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — 本番は Turso。ローカルは `file:local.db` で可
- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- `BETTER_AUTH_URL` — 例: `http://localhost:3000`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google Cloud Console で発行。
  承認済みリダイレクト URI は `{BETTER_AUTH_URL}/api/auth/callback/google`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob のトークン
- `ADMIN_EMAIL` — 管理者（オーナー）のメールアドレス

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバー |
| `pnpm build` / `pnpm start` | 本番ビルド / 起動 |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | スキーマからマイグレーション生成 |
| `pnpm db:migrate` | マイグレーション適用 |
| `pnpm db:studio` | Drizzle Studio |

## 構成メモ

- 認可は `src/lib/authz.ts`（`requireUser` / `isAdmin` / `canMutate`）。
  すべての Server Action（`src/actions/`）冒頭で所有者本人または管理者かを検証。
- 画像は `src/lib/image.ts` でブラウザ圧縮 → Server Action 経由で `src/lib/blob.ts` が Vercel Blob へ `put()`。
  削除時は DB 行と Blob 実体の両方を削除（猫削除は `cat_images` を FK CASCADE）。
- 非公開画像はギャラリーに出さず、詳細画面でも所有者本人／管理者のみ表示（`src/lib/queries.ts`）。
- 猫 ID は連番で、表示時に 4 桁ゼロ埋め（`formatCatId`）した標本番号 `No.0000` として扱う。
