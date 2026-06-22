import { del, put } from "@vercel/blob";

/**
 * Vercel Blob へ画像をアップロードする。
 * 圧縮はクライアント側で済ませている前提（WebP）。
 * 衝突を避けるためランダムサフィックスを付与する。
 */
export async function uploadImage(
  file: File | Blob,
  opts: { prefix: string; contentType?: string },
): Promise<{ url: string; pathname: string }> {
  const blob = await put(`${opts.prefix}.webp`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: opts.contentType ?? "image/webp",
  });
  return { url: blob.url, pathname: blob.pathname };
}

/** Blob 実体を削除する。pathname / url のどちらでも可。失敗しても致命にしない。 */
export async function deleteImage(
  pathnameOrUrl: string | null | undefined,
): Promise<void> {
  if (!pathnameOrUrl) return;
  try {
    await del(pathnameOrUrl);
  } catch (err) {
    // 既に存在しない等は無視。ログのみ。
    console.error("[blob] delete failed:", pathnameOrUrl, err);
  }
}

/** 複数の Blob をまとめて削除する。 */
export async function deleteImages(
  pathnames: (string | null | undefined)[],
): Promise<void> {
  const targets = pathnames.filter((p): p is string => Boolean(p));
  if (targets.length === 0) return;
  try {
    await del(targets);
  } catch (err) {
    console.error("[blob] bulk delete failed:", err);
  }
}
