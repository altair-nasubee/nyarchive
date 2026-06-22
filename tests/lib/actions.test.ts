import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// --- 依存のモック ---
vi.mock("@/lib/db", async () => {
  const h = await import("../helpers/testDb");
  return { db: h.testDb, schema: h.schema };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/blob", () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  deleteImages: vi.fn(),
}));
// requireUser はテストごとに差し替える。canMutate は本物相当の判定を再現。
vi.mock("@/lib/authz", () => ({
  requireUser: vi.fn(),
  canMutate: (user: { id: string; email: string }, ownerId: string) =>
    user.id === ownerId ||
    user.email.trim().toLowerCase() ===
      (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
}));

import { requireUser } from "@/lib/authz";
import { deleteImage, deleteImages, uploadImage } from "@/lib/blob";
import { createCat, deleteCat, updateCat } from "@/actions/cats";
import {
  deleteCatImage,
  toggleImageVisibility,
  uploadCatImage,
} from "@/actions/images";
import {
  applySchema,
  resetDb,
  schema,
  seedCat,
  seedImage,
  seedUser,
  testDb,
} from "../helpers/testDb";

const owner = { id: "owner1", name: "Owner", email: "owner@example.com" };
const visitor = { id: "vis1", name: "Vis", email: "vis@example.com" };
const admin = { id: "admin1", name: "Admin", email: "admin@example.com" };

function asUser(u: { id: string; name: string; email: string }) {
  vi.mocked(requireUser).mockResolvedValue(u);
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeAll(applySchema);

beforeEach(async () => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAIL = "admin@example.com";
  await resetDb();
  await seedUser(owner);
  await seedUser(visitor);
  await seedUser(admin);
});

describe("createCat", () => {
  it("ログインユーザーを飼い主として猫を登録する", async () => {
    asUser(owner);
    await createCat(form({ name: "たま", breed: "キジトラ" }));

    const cats = await testDb.select().from(schema.cats);
    expect(cats).toHaveLength(1);
    expect(cats[0].name).toBe("たま");
    expect(cats[0].ownerId).toBe("owner1");
  });

  it("名前が空ならエラー", async () => {
    asUser(owner);
    await expect(createCat(form({ name: "  " }))).rejects.toThrow(
      "猫の名前を入力してください。",
    );
  });
});

describe("updateCat", () => {
  it("所有者本人は更新できる", async () => {
    asUser(owner);
    const catId = await seedCat({ name: "旧名", ownerId: "owner1" });

    await updateCat(catId, form({ name: "新名", personality: "甘えん坊" }));

    const [cat] = await testDb
      .select()
      .from(schema.cats)
      .where(eq(schema.cats.id, catId));
    expect(cat.name).toBe("新名");
    expect(cat.personality).toBe("甘えん坊");
  });

  it("第三者は更新できない（権限エラー）", async () => {
    asUser(visitor);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });

    await expect(updateCat(catId, form({ name: "乗っ取り" }))).rejects.toThrow(
      "権限がありません。",
    );
  });

  it("管理者は他人の猫も更新できる", async () => {
    asUser(admin);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });

    await updateCat(catId, form({ name: "管理者編集" }));
    const [cat] = await testDb
      .select()
      .from(schema.cats)
      .where(eq(schema.cats.id, catId));
    expect(cat.name).toBe("管理者編集");
  });
});

describe("deleteCat", () => {
  it("猫と配下画像を削除し、Blobもまとめて削除する", async () => {
    asUser(owner);
    const catId = await seedCat({
      name: "たま",
      ownerId: "owner1",
      iconPathname: "icon-path",
    });
    await seedImage({
      catId,
      url: "u1",
      pathname: "p1",
      isPublic: true,
    });
    await seedImage({
      catId,
      url: "u2",
      pathname: "p2",
      isPublic: false,
    });

    await deleteCat(catId);

    // DB から猫も画像も消える（FK CASCADE）
    const cats = await testDb.select().from(schema.cats);
    const imgs = await testDb.select().from(schema.catImages);
    expect(cats).toHaveLength(0);
    expect(imgs).toHaveLength(0);

    // Blob 実体の削除が呼ばれる（画像pathname + アイコンpathname）
    expect(deleteImages).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(deleteImages).mock.calls[0][0];
    expect(arg).toEqual(expect.arrayContaining(["p1", "p2", "icon-path"]));
  });

  it("第三者は削除できない（権限エラー）", async () => {
    asUser(visitor);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });

    await expect(deleteCat(catId)).rejects.toThrow("権限がありません。");
    expect(await testDb.select().from(schema.cats)).toHaveLength(1);
  });
});

describe("uploadCatImage", () => {
  it("所有者は画像を追加できる（既定で公開）", async () => {
    asUser(owner);
    vi.mocked(uploadImage).mockResolvedValue({ url: "uX", pathname: "pX" });
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });

    const fd = new FormData();
    fd.set("file", new File([new Uint8Array([1, 2, 3])], "x.webp", {
      type: "image/webp",
    }));
    await uploadCatImage(catId, fd);

    const imgs = await testDb.select().from(schema.catImages);
    expect(imgs).toHaveLength(1);
    expect(imgs[0].url).toBe("uX");
    expect(imgs[0].isPublic).toBe(true);
  });

  it("ファイルが無ければエラー", async () => {
    asUser(owner);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });
    await expect(uploadCatImage(catId, new FormData())).rejects.toThrow(
      "画像が選択されていません。",
    );
  });

  it("第三者はアップロードできない（権限エラー）", async () => {
    asUser(visitor);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });
    const fd = new FormData();
    fd.set("file", new File([new Uint8Array([1])], "x.webp", {
      type: "image/webp",
    }));
    await expect(uploadCatImage(catId, fd)).rejects.toThrow(
      "権限がありません。",
    );
  });
});

describe("toggleImageVisibility", () => {
  it("公開/非公開を反転する", async () => {
    asUser(owner);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });
    const imageId = await seedImage({
      catId,
      url: "u",
      pathname: "p",
      isPublic: true,
    });

    await toggleImageVisibility(imageId);
    const [img] = await testDb
      .select()
      .from(schema.catImages)
      .where(eq(schema.catImages.id, imageId));
    expect(img.isPublic).toBe(false);
  });

  it("第三者は切り替えできない（権限エラー）", async () => {
    asUser(visitor);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });
    const imageId = await seedImage({
      catId,
      url: "u",
      pathname: "p",
      isPublic: true,
    });
    await expect(toggleImageVisibility(imageId)).rejects.toThrow(
      "権限がありません。",
    );
  });
});

describe("deleteCatImage", () => {
  it("DB行とBlob実体を削除する", async () => {
    asUser(owner);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });
    const imageId = await seedImage({
      catId,
      url: "u",
      pathname: "p-del",
      isPublic: true,
    });

    await deleteCatImage(imageId);

    expect(await testDb.select().from(schema.catImages)).toHaveLength(0);
    expect(deleteImage).toHaveBeenCalledWith("p-del");
  });

  it("第三者は削除できない（権限エラー）", async () => {
    asUser(visitor);
    const catId = await seedCat({ name: "たま", ownerId: "owner1" });
    const imageId = await seedImage({
      catId,
      url: "u",
      pathname: "p",
      isPublic: true,
    });
    await expect(deleteCatImage(imageId)).rejects.toThrow("権限がありません。");
    expect(await testDb.select().from(schema.catImages)).toHaveLength(1);
  });
});
