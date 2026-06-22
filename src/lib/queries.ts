import { and, asc, desc, eq, inArray } from "drizzle-orm";

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
 * 猫のアイコンURLを解決する（公開画像のみが対象）。
 * - 明示選択 (iconImageId) が公開画像一覧に存在すればそれを使う
 * - 無ければ「最初にアップした公開画像（最古）」へフォールバック
 * - 公開画像が無ければ null
 */
export function resolveCatIconUrl(
  iconImageId: number | null,
  publicImages: { id: number; url: string; uploadedAt: Date }[],
): string | null {
  if (publicImages.length === 0) return null;
  if (iconImageId != null) {
    const explicit = publicImages.find((i) => i.id === iconImageId);
    if (explicit) return explicit.url;
  }
  let oldest = publicImages[0];
  for (const img of publicImages) {
    if (img.uploadedAt.getTime() < oldest.uploadedAt.getTime()) oldest = img;
  }
  return oldest.url;
}

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
      catIconImageId: cats.iconImageId,
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
  const catIconChoice = new Map<number, number | null>();

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
        iconUrl: null,
        breed: r.catBreed,
        images: [],
      };
      catMap.set(r.catId, cat);
      catIconChoice.set(r.catId, r.catIconImageId);
      owner.cats.push(cat);
    }

    cat.images.push({
      id: r.imageId,
      url: r.imageUrl,
      uploadedAt: r.uploadedAt,
    });
  }

  // 公開画像が出揃ってからアイコンを解決
  for (const owner of owners.values()) {
    for (const cat of owner.cats) {
      cat.iconUrl = resolveCatIconUrl(
        catIconChoice.get(cat.id) ?? null,
        cat.images,
      );
    }
  }

  return [...owners.values()];
}

/** ログインユーザー自身が登録した猫一覧（底部バー用）。追加順。 */
export async function getOwnedCats(ownerId: string) {
  const owned = await db
    .select({
      id: cats.id,
      name: cats.name,
      iconImageId: cats.iconImageId,
    })
    .from(cats)
    .where(eq(cats.ownerId, ownerId))
    .orderBy(asc(cats.id));

  if (owned.length === 0) return [];

  // 各猫の公開画像を取得してアイコンを解決
  const images = await db
    .select({
      catId: catImages.catId,
      id: catImages.id,
      url: catImages.url,
      uploadedAt: catImages.uploadedAt,
    })
    .from(catImages)
    .where(
      and(
        inArray(
          catImages.catId,
          owned.map((c) => c.id),
        ),
        eq(catImages.isPublic, true),
      ),
    );

  const byCat = new Map<number, typeof images>();
  for (const img of images) {
    const list = byCat.get(img.catId) ?? [];
    list.push(img);
    byCat.set(img.catId, list);
  }

  return owned.map((c) => ({
    id: c.id,
    name: c.name,
    iconUrl: resolveCatIconUrl(c.iconImageId, byCat.get(c.id) ?? []),
  }));
}

export type CatDetail = Awaited<ReturnType<typeof getCatWithImages>>;

/**
 * 猫の詳細と画像一覧。
 * 閲覧者が所有者本人または管理者の場合は非公開画像も含める。
 * アイコンURLは（公開画像のみを対象に）解決して返す。
 */
export async function getCatWithImages(
  catId: number,
  viewer: { id: string; isAdmin: boolean },
) {
  const [cat] = await db
    .select({
      id: cats.id,
      name: cats.name,
      iconImageId: cats.iconImageId,
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

  const iconUrl = resolveCatIconUrl(
    cat.iconImageId,
    images.filter((i) => i.isPublic),
  );

  return { ...cat, iconUrl, canMutate: canSeePrivate, images };
}
