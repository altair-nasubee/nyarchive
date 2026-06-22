import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { catImages, cats, user } from "@/lib/db/schema";

export type GalleryImage = {
  id: number;
  url: string;
  uploadedAt: Date;
};

export type GalleryCat = {
  id: number;
  name: string;
  iconUrl: string | null;
  breed: string | null;
  images: GalleryImage[];
};

export type GalleryOwner = {
  id: string;
  name: string;
  image: string | null;
  cats: GalleryCat[];
};

/**
 * メインギャラリー用データ。
 * 公開画像を持つ猫のみを対象に、飼い主 → 猫 → 画像 の階層に整形する。
 */
export async function getGalleryData(): Promise<GalleryOwner[]> {
  const rows = await db
    .select({
      ownerId: user.id,
      ownerName: user.name,
      ownerImage: user.image,
      catId: cats.id,
      catName: cats.name,
      catIcon: cats.iconUrl,
      catBreed: cats.breed,
      imageId: catImages.id,
      imageUrl: catImages.url,
      uploadedAt: catImages.uploadedAt,
    })
    .from(catImages)
    .innerJoin(cats, eq(catImages.catId, cats.id))
    .innerJoin(user, eq(cats.ownerId, user.id))
    .where(eq(catImages.isPublic, true))
    .orderBy(asc(user.name), asc(cats.id), desc(catImages.uploadedAt));

  const owners = new Map<string, GalleryOwner>();
  const catMap = new Map<number, GalleryCat>();

  for (const r of rows) {
    let owner = owners.get(r.ownerId);
    if (!owner) {
      owner = {
        id: r.ownerId,
        name: r.ownerName,
        image: r.ownerImage,
        cats: [],
      };
      owners.set(r.ownerId, owner);
    }

    let cat = catMap.get(r.catId);
    if (!cat) {
      cat = {
        id: r.catId,
        name: r.catName,
        iconUrl: r.catIcon,
        breed: r.catBreed,
        images: [],
      };
      catMap.set(r.catId, cat);
      owner.cats.push(cat);
    }

    cat.images.push({
      id: r.imageId,
      url: r.imageUrl,
      uploadedAt: r.uploadedAt,
    });
  }

  return [...owners.values()];
}

/** ログインユーザー自身が登録した猫一覧（底部バー用）。追加順。 */
export async function getOwnedCats(ownerId: string) {
  return db
    .select({
      id: cats.id,
      name: cats.name,
      iconUrl: cats.iconUrl,
    })
    .from(cats)
    .where(eq(cats.ownerId, ownerId))
    .orderBy(asc(cats.id));
}

export type CatDetail = Awaited<ReturnType<typeof getCatWithImages>>;

/**
 * 猫の詳細と画像一覧。
 * 閲覧者が所有者本人または管理者の場合は非公開画像も含める。
 */
export async function getCatWithImages(
  catId: number,
  viewer: { id: string; isAdmin: boolean },
) {
  const [cat] = await db
    .select({
      id: cats.id,
      name: cats.name,
      iconUrl: cats.iconUrl,
      iconPathname: cats.iconPathname,
      breed: cats.breed,
      birthDate: cats.birthDate,
      personality: cats.personality,
      likes: cats.likes,
      dislikes: cats.dislikes,
      ownerId: cats.ownerId,
      createdAt: cats.createdAt,
      ownerName: user.name,
      ownerImage: user.image,
    })
    .from(cats)
    .innerJoin(user, eq(cats.ownerId, user.id))
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat) return null;

  const canSeePrivate = viewer.isAdmin || viewer.id === cat.ownerId;

  const images = await db
    .select({
      id: catImages.id,
      url: catImages.url,
      pathname: catImages.pathname,
      isPublic: catImages.isPublic,
      uploadedAt: catImages.uploadedAt,
    })
    .from(catImages)
    .where(
      canSeePrivate
        ? eq(catImages.catId, catId)
        : and(eq(catImages.catId, catId), eq(catImages.isPublic, true)),
    )
    .orderBy(desc(catImages.uploadedAt));

  return { ...cat, canMutate: canSeePrivate, images };
}
