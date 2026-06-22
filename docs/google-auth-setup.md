# Google ログイン（Google OAuth）設定ガイド

nyarchive は [Better Auth](https://www.better-auth.com/) を使い、**Google アカウントでのログイン**のみを提供します。
このドキュメントでは、ローカル開発と本番（Vercel）で Google ログインを動かすための設定手順をまとめます。

---

## 全体像

- 認証ライブラリ: **Better Auth**（`src/lib/auth.ts`）
- 認証エンドポイント: `src/app/api/auth/[...all]/route.ts`（`/api/auth/*` を処理）
- Google のコールバック先（**リダイレクト URI**）: `{BETTER_AUTH_URL}/api/auth/callback/google`
- 管理者判定: ログインしたメールが環境変数 `ADMIN_EMAIL` と一致したら管理者（`src/lib/authz.ts` の `isAdmin`）

> 必要な環境変数の一覧はリポジトリ直下の `.env.example` を参照してください。

---

## 1. Google Cloud で OAuth クライアントを作成

### 1-1. プロジェクトを用意
1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. 画面上部のプロジェクト選択 →「新しいプロジェクト」（既存でも可）

### 1-2. OAuth 同意画面（OAuth consent screen）を設定
1. 左メニュー「**API とサービス**」→「**OAuth 同意画面**」
2. User Type は **External（外部）** を選択して作成
3. アプリ名・サポートメール・デベロッパー連絡先など必須項目を入力
4. **対象（Audience / Test users）** に、ログインを許可したい Google アカウントを追加
   - 「テスト中（Testing）」の状態では、ここに登録したアカウントしかログインできません
   - **管理者になりたいメール（`ADMIN_EMAIL` に設定する値）を必ず追加**してください
5. スコープは既定（`openid` / `email` / `profile`）のままで OK

### 1-3. 認証情報（OAuth クライアント ID）を作成
1. 左メニュー「**API とサービス**」→「**認証情報**」
2. 「**認証情報を作成**」→「**OAuth クライアント ID**」
3. アプリケーションの種類: **ウェブ アプリケーション**
4. 以下を登録（**末尾スラッシュや http/https・ポートまで完全一致**させること）

   | 項目 | ローカル開発 | 本番（例） |
   | --- | --- | --- |
   | 承認済みの JavaScript 生成元 | `http://localhost:3000` | `https://your-domain.com` |
   | 承認済みのリダイレクト URI | `http://localhost:3000/api/auth/callback/google` | `https://your-domain.com/api/auth/callback/google` |

5. 作成後に表示される **クライアント ID** と **クライアント シークレット** を控える

> リダイレクト URI は常に `{BETTER_AUTH_URL}/api/auth/callback/google` の形です。
> ポートを 3000 以外にする場合は、`BETTER_AUTH_URL` と Google 側の URI／生成元の**両方**を合わせて変更してください。

---

## 2. 環境変数を設定

### ローカル開発（`.env.local`）
リポジトリ直下の `.env.local` に以下を設定します（`.env.local` は Git 管理外）。

```bash
# Better Auth
BETTER_AUTH_SECRET="（openssl rand -base64 32 で生成）"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth（手順1で取得した値）
GOOGLE_CLIENT_ID="xxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxxxx"

# 管理者（オーナー）のメールアドレス
ADMIN_EMAIL="you@example.com"
```

`BETTER_AUTH_SECRET` は次のコマンドで生成できます。

```bash
openssl rand -base64 32
```

> 環境変数は dev サーバー起動時にのみ読み込まれます。値を変えたら **`pnpm dev` を再起動**してください。

### 本番（Vercel）
Vercel のプロジェクト → **Settings → Environment Variables** に同じキーを登録します。

- `BETTER_AUTH_URL` は本番ドメイン（例: `https://your-domain.com`）
- `BETTER_AUTH_SECRET` はローカルとは別の値を推奨
- Google Cloud 側のリダイレクト URI／生成元にも本番ドメインを追加（手順 1-3 の表）

---

## 3. 動作確認

```bash
pnpm install
pnpm db:migrate   # ローカルは file:local.db にスキーマ適用
pnpm dev
```

1. `http://localhost:3000` を開く → 未ログインなら `/login` にリダイレクト
2. 「Google でログイン」をクリック → Google の同意画面 → アプリに戻る
3. `ADMIN_EMAIL` と同じアカウントでログインすると、管理者として全データを操作可能

---

## トラブルシューティング

| 症状 / エラー | 原因 | 対処 |
| --- | --- | --- |
| `redirect_uri_mismatch` | Google 側のリダイレクト URI が不一致 | `{BETTER_AUTH_URL}/api/auth/callback/google` を**完全一致**で登録。ポート・http/https も合わせる |
| `Social provider google is missing clientId or clientSecret`（起動時の警告） | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` が空 | `.env.local` に設定して **dev 再起動** |
| `access_blocked` / テストユーザー以外で入れない | OAuth 同意画面が「テスト中」 | 同意画面のテストユーザーにそのメールを追加（または本番公開ステータスへ） |
| `account_not_linked` | 同じメールの既存ユーザーに Google アカウントが未リンク | 既存の重複ユーザーを削除（ローカルなら `local.db` をリセット）。本アプリは `src/lib/auth.ts` で Google を `trustedProviders` に設定済みのため、通常は同一メールに自動リンクされる |
| ログイン後に管理者にならない | `ADMIN_EMAIL` とログインメールが不一致 | 大文字小文字を含め一致しているか確認（`isAdmin` は前後空白・大文字小文字を無視して比較） |

### ローカル DB のリセット（テストアカウントを消したいとき）
```bash
rm -f local.db local.db-shm local.db-wal
pnpm db:migrate
```

---

## 参考（コード上の関連箇所）

- `src/lib/auth.ts` — Better Auth サーバ設定（Google プロバイダ、`account.accountLinking`）
- `src/lib/auth-client.ts` — クライアント側 `signIn` / `signOut`
- `src/app/api/auth/[...all]/route.ts` — 認証エンドポイント
- `src/lib/authz.ts` — `requireUser` / `isAdmin` / `canMutate`
- `.env.example` — 必要な環境変数のテンプレート
