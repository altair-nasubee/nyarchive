# デプロイ＆動作確認ガイド（Vercel / Turso / Vercel Blob）

nyarchive を本番環境（Vercel）にデプロイし、動作確認するまでの手順をまとめます。

- ホスティング: **Vercel**（Next.js 16）
- DB: **Turso（libSQL）**
- ストレージ: **Vercel Blob**
- 認証: **Better Auth（Google OAuth）** … 詳細は [`google-auth-setup.md`](./google-auth-setup.md)

> 必要な環境変数の一覧は、リポジトリ直下の `.env.example` も参照してください。

---

## 0. 前提

- GitHub などに本リポジトリを push 済み（Vercel と連携するため）
- [Vercel アカウント](https://vercel.com/)（Hobby で可）
- [Turso アカウント](https://turso.tech/) と Turso CLI
- ローカルで `pnpm install` 済み・`pnpm test` / `pnpm build` が通ること

```bash
pnpm install
pnpm test     # 48件パスを確認
pnpm build    # 本番ビルドが通ることを確認
```

---

## 1. 本番 DB（Turso）を用意

### 1-1. Turso CLI でデータベースを作成
```bash
# 初回のみ
curl -sSfL https://get.tur.so/install.sh | bash

# ログイン（Macの場合）
turso auth login

# ログイン（WSLの場合）
# 注意："turso auth login"は、WSLではブラウザが開けずエラーになる
# 代わりに以下の手順でコマンドを実行する
turso auth login --headless
# (1) URLが表示される
# (2) ブラウザでそのアドレスを開き、GitHubでサインインする
# (3) turso config set token "<YOUR TOKEN>" が表示されるのでコピー
# (4) ターミナルでコピーしたコマンドをそのまま実行
# (5) "Token set succesfully." と表示されれば成功

# DB 作成（名前・リージョンは任意。例: 東京 nrt）
turso db create nyarchive --location nrt

# 接続情報を取得
turso db show nyarchive --url                # → TURSO_DATABASE_URL（libsql://... ）
turso db tokens create nyarchive             # → TURSO_AUTH_TOKEN
```

### 1-2. スキーマ（マイグレーション）を本番 DB に適用
`drizzle/` のマイグレーションを Turso 本番 DB に対して実行します。
**環境変数をインラインで渡す**ことで、`.env.local`（ローカルの `file:local.db`）より優先されます。

```bash
TURSO_DATABASE_URL="libsql://nyarchive-xxxx.turso.io" \
TURSO_AUTH_TOKEN="（1-1で発行したトークン）" \
pnpm db:migrate
```

> 以降、スキーマを変更したら `pnpm db:generate`（マイグレーション生成）→ 上記コマンドで本番へ適用、という流れになります。

---

## 2. Vercel プロジェクトを作成

1. [Vercel ダッシュボード](https://vercel.com/) →「**Add New… → Project**」
2. 本リポジトリを **Import**
3. Framework Preset は **Next.js**（自動検出）。Build/Output 設定は既定のままで OK
   - Install: `pnpm install` / Build: `next build`（既定）
4. 環境変数（手順4）を設定する。ただし、環境変数の `BLOB_READ_WRITE_TOKEN` はまだないので、ここでは追加しない。もしあれば削除。
5. [Deploy] を実行して、`BLOB_READ_WRITE_TOKEN` がまだ無いので即 [Cancel Deploy] 

---

## 3. Vercel Blob ストアを接続

1. Vercel プロジェクト →「**Storage**」タブ →「**Create Database → Blob**」
2. ストア名を付けて「Add a read-write token env var to this connection」をONにして、**このプロジェクトに Connect**
3. 接続すると **`BLOB_READ_WRITE_TOKEN`** がプロジェクトの環境変数に自動追加されます
   （手動で設定する必要はありません）

> 無料(Hobby)枠の目安: ストレージ約5GB / 転送100GB/月。画像中心の個人利用なら十分です。

---

## 4. 環境変数を設定（Vercel）

プロジェクト →「**Settings → Environment Variables**」に以下を登録します（Production / Preview 両方に入れると Preview でも動作確認できます）。

| 変数 | 値 | 備考 |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | `libsql://nyarchive-xxxx.turso.io` | 手順1 |
| `TURSO_AUTH_TOKEN` | （手順1のトークン） | |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` で生成 | **本番専用の値**にする |
| `BETTER_AUTH_URL` | `https://<your-app>.vercel.app` | デプロイ後の本番URL。後述の注意あり |
| `GOOGLE_CLIENT_ID` | （Google OAuth） | [`google-auth-setup.md`](./google-auth-setup.md) |
| `GOOGLE_CLIENT_SECRET` | （Google OAuth） | |
| `ADMIN_EMAIL` | あなたのGoogleアカウントのメール | このメールで入ると管理者 |
| `BLOB_READ_WRITE_TOKEN` | （手順3で自動追加） | 手動設定不要 |

> **`BETTER_AUTH_URL` の確定順**: 初回デプロイで本番URL（`https://xxx.vercel.app` またはカスタムドメイン）が決まります。
> URL 確定後に `BETTER_AUTH_URL` を正しい値に設定し、**再デプロイ**してください（環境変数の変更はビルドに反映させる必要があります）。

---

## 5. Google OAuth に本番URLを登録

[Google Cloud Console](https://console.cloud.google.com/) の OAuth クライアントに、本番URLを追加します（詳細手順は [`google-auth-setup.md`](./google-auth-setup.md)）。

- **承認済みの JavaScript 生成元**: `https://<your-app>.vercel.app`
- **承認済みのリダイレクト URI**: `https://<your-app>.vercel.app/api/auth/callback/google`

> ローカル用（`http://localhost:3000/...`）は残したまま、本番用を**追加**で登録します。
> カスタムドメインを使う場合はそのドメインでも同様に登録します。

---

## 6. デプロイ

- Vercel は **main ブランチへの push で自動デプロイ**されます（Git連携時）。
- 手動で行う場合は CLI でも可能:

```bash
pnpm dlx vercel        # プレビューデプロイ
pnpm dlx vercel --prod # 本番デプロイ
```

環境変数（特に `BETTER_AUTH_URL`）を変更した場合は、**再デプロイ**して反映してください。

---

## 7. 動作確認チェックリスト

本番URL（`https://<your-app>.vercel.app`）を開いて、以下を順に確認します。

- [ ] 未ログインで `/` を開くと `/login` にリダイレクトされる
- [ ] 「Google でログイン」→ 同意画面 → アプリに戻れる（`ADMIN_EMAIL` のアカウントで）
- [ ] `/cats/new` で猫を登録 → 底部バーにアイコンが出る／IDが `No.0001` 形式
- [ ] 猫詳細で画像をアップロード → サムネ表示。ブラウザの DevTools で送信ファイルが **WebP・圧縮済み**であること
- [ ] アップロード画像が既定で**公開**になり、トップのギャラリーに出る
- [ ] 画像を**非公開**に切替 → 別アカウント（別ブラウザ/シークレット）から見えなくなる
- [ ] 画像削除・猫削除で、ギャラリーから消える（Blob 実体も削除される）
- [ ] **別の Google アカウント**でログイン → 他人の公開画像は見えるが、他人の猫の編集・削除はできない
- [ ] `ADMIN_EMAIL` のアカウントは、他人の猫も含め全データを編集・削除でき、非公開画像も見える
- [ ] 年齢が誕生日から算出表示され、誕生日未設定でも崩れない

### Vercel Blob の保存状況の確認
Vercel プロジェクト →「Storage → 該当 Blob ストア」で、アップロードした blob が増え、削除で消えることを確認できます。

---

## 8. トラブルシューティング

| 症状 | 原因 | 対処 |
| --- | --- | --- |
| ログインで `redirect_uri_mismatch` | Google のリダイレクトURIが本番URLと不一致 | 手順5を確認。`https://<本番>/api/auth/callback/google` を完全一致で登録 |
| ログイン後すぐログアウト状態に戻る / Cookie が効かない | `BETTER_AUTH_URL` が本番URLと不一致 | 本番URLに設定して**再デプロイ** |
| `access_blocked`（テストユーザー以外で入れない） | OAuth 同意画面が「テスト中」 | テストユーザー追加、または本番公開ステータスへ |
| 画像アップロードが失敗する | Blob トークン未設定 | 手順3で Blob ストアをプロジェクトに Connect（`BLOB_READ_WRITE_TOKEN` 自動付与） |
| 画面表示時に DB エラー / テーブルが無い | 本番DBにスキーマ未適用 | 手順1-2 のマイグレーションを本番 `TURSO_*` に対して実行 |
| ログインできるが管理者にならない | `ADMIN_EMAIL` とログインメール不一致 | 値を確認（大文字小文字・前後空白は無視して比較される） |
| 画像が更新したのに古いまま見える | Blob/ブラウザのキャッシュ | 数十秒待つ。本アプリは削除時に新規pathnameを使う設計のため通常は発生しにくい |

---

## 参考

- 認証の詳細: [`google-auth-setup.md`](./google-auth-setup.md)
- 環境変数テンプレート: リポジトリ直下 `.env.example`
- スキーマ／マイグレーション: `src/lib/db/schema.ts` / `drizzle/`
- Vercel Blob 無料枠の検討メモ: 実装プラン `plans/web-web-web-precious-eich.md` の追補セクション
