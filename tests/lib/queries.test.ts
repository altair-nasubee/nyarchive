import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// queries.ts は `@/lib/db` の db を使う。インメモリDBに差し替える。
vi.mock("@/lib/db", async () => {
  const h = await import("../helpers/testDb");
  return { db: h.testDb, schema: h.schema };
});

import {
  applySchema,
  resetDb,
  seedCat,
  seedImage,
  seedUser,
} from "../helpers/testDb";
import {
  getCatWithImages,
  getGalleryData,
  getOwnedCats,
} from "@/lib/queries";

beforeAll(applySchema);
beforeEach(resetDb);

describe("getGalleryData", () => {
  it("公開画像のみを飼い主→猫→画像に集約し、非公開は除外する", async () => {
    await seedUser({ id: "alice", name: "Alice", email: "alice@example.com" });
    await seedUser({ id: "bob", name: "Bob", email: "bob@example.com" });

    const aliceCat = await seedCat({ name: "たま", ownerId: "alice" });
    const bobCat = await seedCat({ name: "みけ", ownerId: "bob" });

    await seedImage({
      catId: aliceCat,
      url: "https://blob/a-pub.webp",
      pathname: "a-pub",
      isPublic: true,
    });
    await seedImage({
      catId: aliceCat,
      url: "https://blob/a-priv.webp",
      pathname: "a-priv",
      isPublic: false,
    });
    await seedImage({
      catId: bobCat,
      url: "https://blob/b-pub.webp",
      pathname: "b-pub",
      isPublic: true,
    });

    const owners = await getGalleryData();

    expect(owners).toHaveLength(2);

    const alice = owners.find((o) => o.id === "alice")!;
    expect(alice.cats).toHaveLength(1);
    expect(alice.cats[0].images).toHaveLength(1);
    expect(alice.cats[0].images[0].url).toBe("https://blob/a-pub.webp");

    // 非公開画像はどこにも現れない
    const allUrls = owners.flatMap((o) =>
      o.cats.flatMap((c) => c.images.map((i) => i.url)),
    );
    expect(allUrls).not.toContain("https://blob/a-priv.webp");
    expect(allUrls).toContain("https://blob/b-pub.webp");
  });

  it("公開画像が無い猫・飼い主は含まれない", async () => {
    await seedUser({ id: "alice", name: "Alice", email: "alice@example.com" });
    const cat = await seedCat({ name: "ひみつ", ownerId: "alice" });
    await seedImage({
      catId: cat,
      url: "https://blob/secret.webp",
      pathname: "secret",
      isPublic: false,
    });

    const owners = await getGalleryData();
    expect(owners).toHaveLength(0);
  });
});

describe("getOwnedCats", () => {
  it("指定ユーザーの猫だけを追加順(id昇順)で返す", async () => {
    await seedUser({ id: "alice", name: "Alice", email: "alice@example.com" });
    await seedUser({ id: "bob", name: "Bob", email: "bob@example.com" });
    const c1 = await seedCat({ name: "1号", ownerId: "alice" });
    await seedCat({ name: "他人猫", ownerId: "bob" });
    const c3 = await seedCat({ name: "2号", ownerId: "alice" });

    const cats = await getOwnedCats("alice");
    expect(cats.map((c) => c.id)).toEqual([c1, c3]);
    expect(cats.map((c) => c.name)).toEqual(["1号", "2号"]);
  });
});

describe("getCatWithImages", () => {
  async function seedAliceCatWithImages() {
    await seedUser({ id: "alice", name: "Alice", email: "alice@example.com" });
    const catId = await seedCat({ name: "たま", ownerId: "alice" });
    await seedImage({
      catId,
      url: "https://blob/pub.webp",
      pathname: "pub",
      isPublic: true,
    });
    await seedImage({
      catId,
      url: "https://blob/priv.webp",
      pathname: "priv",
      isPublic: false,
    });
    return catId;
  }

  it("所有者本人は非公開画像も見え、canMutate=true", async () => {
    const catId = await seedAliceCatWithImages();
    const cat = await getCatWithImages(catId, {
      id: "alice",
      isAdmin: false,
    });
    expect(cat).not.toBeNull();
    expect(cat!.canMutate).toBe(true);
    expect(cat!.images).toHaveLength(2);
  });

  it("管理者も非公開画像が見え、canMutate=true", async () => {
    const catId = await seedAliceCatWithImages();
    const cat = await getCatWithImages(catId, {
      id: "someone-else",
      isAdmin: true,
    });
    expect(cat!.canMutate).toBe(true);
    expect(cat!.images).toHaveLength(2);
  });

  it("第三者は公開画像のみ、canMutate=false", async () => {
    const catId = await seedAliceCatWithImages();
    const cat = await getCatWithImages(catId, {
      id: "visitor",
      isAdmin: false,
    });
    expect(cat!.canMutate).toBe(false);
    expect(cat!.images).toHaveLength(1);
    expect(cat!.images[0].url).toBe("https://blob/pub.webp");
  });

  it("存在しない猫は null", async () => {
    const cat = await getCatWithImages(99999, { id: "alice", isAdmin: false });
    expect(cat).toBeNull();
  });
});
