"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { catImages, cats } from "@/lib/db/schema";
import { canMutate, requireUser } from "@/lib/authz";
import { deleteImage, deleteImages, uploadImage } from "@/lib/blob";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

function parseBirthDate(formData: FormData): Date | null {
  const v = str(formData, "birthDate");
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function maybeUploadIcon(
  formData: FormData,
): Promise<{ url: string; pathname: string } | null> {
  const file = formData.get("icon");
  if (!(file instanceof File) || file.size === 0) return null;
  return uploadImage(file, { prefix: "cats/icons/icon" });
}

/** 猫プロフィールを新規登録し、その画像追加画面へ遷移する。 */
export async function createCat(formData: FormData): Promise<void> {
  const viewer = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("猫の名前を入力してください。");

  const icon = await maybeUploadIcon(formData);

  const [created] = await db
    .insert(cats)
    .values({
      name,
      breed: str(formData, "breed"),
      birthDate: parseBirthDate(formData),
      personality: str(formData, "personality"),
      likes: str(formData, "likes"),
      dislikes: str(formData, "dislikes"),
      iconUrl: icon?.url ?? null,
      iconPathname: icon?.pathname ?? null,
      ownerId: viewer.id,
    })
    .returning({ id: cats.id });

  revalidatePath("/");
  redirect(`/cats/${created.id}`);
}

/** 猫プロフィールを更新する。所有者本人または管理者のみ。 */
export async function updateCat(
  catId: number,
  formData: FormData,
): Promise<void> {
  const viewer = await requireUser();

  const [target] = await db
    .select({ ownerId: cats.ownerId, iconPathname: cats.iconPathname })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);
  if (!target) throw new Error("対象の猫が見つかりません。");
  if (!canMutate(viewer, target.ownerId)) throw new Error("権限がありません。");

  const name = str(formData, "name");
  if (!name) throw new Error("猫の名前を入力してください。");

  const icon = await maybeUploadIcon(formData);

  await db
    .update(cats)
    .set({
      name,
      breed: str(formData, "breed"),
      birthDate: parseBirthDate(formData),
      personality: str(formData, "personality"),
      likes: str(formData, "likes"),
      dislikes: str(formData, "dislikes"),
      ...(icon
        ? { iconUrl: icon.url, iconPathname: icon.pathname }
        : {}),
    })
    .where(eq(cats.id, catId));

  // アイコンを差し替えた場合は旧アイコンを削除
  if (icon && target.iconPathname) {
    await deleteImage(target.iconPathname);
  }

  revalidatePath("/");
  revalidatePath(`/cats/${catId}`);
}

/** 猫プロフィールと配下の画像をすべて削除する。所有者本人または管理者のみ。 */
export async function deleteCat(catId: number): Promise<void> {
  const viewer = await requireUser();

  const [target] = await db
    .select({ ownerId: cats.ownerId, iconPathname: cats.iconPathname })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);
  if (!target) throw new Error("対象の猫が見つかりません。");
  if (!canMutate(viewer, target.ownerId)) throw new Error("権限がありません。");

  // 配下画像の Blob を収集して削除
  const images = await db
    .select({ pathname: catImages.pathname })
    .from(catImages)
    .where(eq(catImages.catId, catId));

  await deleteImages([
    ...images.map((i) => i.pathname),
    target.iconPathname,
  ]);

  // DB 行を削除（cat_images は FK CASCADE で同時に削除）
  await db.delete(cats).where(eq(cats.id, catId));

  revalidatePath("/");
  redirect("/");
}
