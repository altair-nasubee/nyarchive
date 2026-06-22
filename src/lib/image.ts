import imageCompression from "browser-image-compression";

/**
 * クライアント側で画像を圧縮し WebP に変換する。
 * アップロード前にブラウザで実行し、回線とサーバー負荷を抑える。
 */
async function compress(
  file: File,
  options: { maxWidthOrHeight: number; maxSizeMB: number },
): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.82,
  });
  // 出力ファイル名を .webp に揃える
  const base = file.name.replace(/\.[^.]+$/, "");
  return new File([compressed], `${base}.webp`, { type: "image/webp" });
}

/** ギャラリー本体用の画像（最長辺 1920px / 〜1MB）。 */
export function compressPhoto(file: File): Promise<File> {
  return compress(file, { maxWidthOrHeight: 1920, maxSizeMB: 1 });
}

/** 猫アイコン用の小さな画像（最長辺 320px / 〜0.2MB）。 */
export function compressIcon(file: File): Promise<File> {
  return compress(file, { maxWidthOrHeight: 320, maxSizeMB: 0.2 });
}

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/avif";
