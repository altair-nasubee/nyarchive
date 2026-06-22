"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { catImages, cats } from "@/lib/db/schema";
import { canMutate, requireUser } from "@/lib/authz";
import { deleteImage, uploadImage } from "@/lib/blob";

/** 指定した猫の所有者を取得し、操作権限を確認する。 */
async function assertCanMutateCat(
  catId: number,
  viewer: { id: string; email: string },
) {
  const [target] = await db
    .select({ ownerId: cats.ownerId })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);
  if (!target) throw new Error("対象の猫が見つかりません。");
  if (!canMutate(viewer, target.ownerId)) throw new Error("権限がありません。");
}

/** 猫に画像を追加する（デフォルト公開）。所有者本人または管理者のみ。 */
export async function uploadCatImage(
  catId: number,
  formData: FormData,
): Promise<void> {
  const viewer = await requireUser();
  await assertCanMutateCat(catId, viewer);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("画像が選択されていません。");
  }

  const { url, pathname } = await uploadImage(file, {
    prefix: `cats/${catId}/photo`,
  });

  await db.insert(catImages).values({
    catId,
    url,
    pathname,
    isPublic: true,
  });

  revalidatePath("/");
  revalidatePath(`/cats/${catId}`);
}

/** 画像の公開／非公開を切り替える。所有者本人または管理者のみ。 */
export async function toggleImageVisibility(imageId: number): Promise<void> {
  const viewer = await requireUser();

  const [img] = await db
    .select({
      id: catImages.id,
      catId: catImages.catId,
      isPublic: catImages.isPublic,
      ownerId: cats.ownerId,
    })
    .from(catImages)
    .innerJoin(cats, eq(catImages.catId, cats.id))
    .where(eq(catImages.id, imageId))
    .limit(1);
  if (!img) throw new Error("対象の画像が見つかりません。");
  if (!canMutate(viewer, img.ownerId)) throw new Error("権限がありません。");

  await db
    .update(catImages)
    .set({ isPublic: !img.isPublic })
    .where(eq(catImages.id, imageId));

  revalidatePath("/");
  revalidatePath(`/cats/${img.catId}`);
}

/** 画像を削除する（Blob 実体も削除）。所有者本人または管理者のみ。 */
export async function deleteCatImage(imageId: number): Promise<void> {
  const viewer = await requireUser();

  const [img] = await db
    .select({
      id: catImages.id,
      catId: catImages.catId,
      pathname: catImages.pathname,
      ownerId: cats.ownerId,
    })
    .from(catImages)
    .innerJoin(cats, eq(catImages.catId, cats.id))
    .where(eq(catImages.id, imageId))
    .limit(1);
  if (!img) throw new Error("対象の画像が見つかりません。");
  if (!canMutate(viewer, img.ownerId)) throw new Error("権限がありません。");

  await db.delete(catImages).where(eq(catImages.id, imageId));
  await deleteImage(img.pathname);

  // この画像がアイコンに指定されていたら未設定へ戻す（自動フォールバックに任せる）
  await db
    .update(cats)
    .set({ iconImageId: null })
    .where(and(eq(cats.id, img.catId), eq(cats.iconImageId, imageId)));

  revalidatePath("/");
  revalidatePath(`/cats/${img.catId}`);
}
