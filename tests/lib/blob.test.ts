import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({ put: vi.fn(), del: vi.fn() }));

import { del, put } from "@vercel/blob";

import { deleteImage, deleteImages, uploadImage } from "@/lib/blob";

const putMock = vi.mocked(put);
const delMock = vi.mocked(del);

beforeEach(() => {
  vi.clearAllMocks();
  // deleteImage はエラーを握りつぶす際に console.error する → ノイズを抑える
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("uploadImage", () => {
  it("pathname に .webp を付け、public/addRandomSuffix/contentType を指定する", async () => {
    putMock.mockResolvedValue({ url: "https://blob/x", pathname: "x.webp" } as never);
    const file = new Blob([new Uint8Array([1, 2, 3])]);

    const result = await uploadImage(file, { prefix: "cats/1/photo" });

    expect(putMock).toHaveBeenCalledWith("cats/1/photo.webp", file, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
    });
    expect(result).toEqual({ url: "https://blob/x", pathname: "x.webp" });
  });

  it("contentType を上書きできる", async () => {
    putMock.mockResolvedValue({ url: "u", pathname: "p" } as never);
    await uploadImage(new Blob(["a"]), {
      prefix: "p",
      contentType: "image/avif",
    });
    expect(putMock.mock.calls[0][2]).toMatchObject({
      contentType: "image/avif",
    });
  });
});

describe("deleteImage", () => {
  it("pathname を del に渡す", async () => {
    delMock.mockResolvedValue(undefined as never);
    await deleteImage("some/path");
    expect(delMock).toHaveBeenCalledWith("some/path");
  });

  it("null/undefined なら del を呼ばない", async () => {
    await deleteImage(null);
    await deleteImage(undefined);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("del が失敗しても例外を投げない（握りつぶす）", async () => {
    delMock.mockRejectedValue(new Error("boom"));
    await expect(deleteImage("p")).resolves.toBeUndefined();
  });
});

describe("deleteImages", () => {
  it("falsy を除外して配列で del を呼ぶ", async () => {
    delMock.mockResolvedValue(undefined as never);
    await deleteImages(["a", null, "b", undefined]);
    expect(delMock).toHaveBeenCalledTimes(1);
    expect(delMock).toHaveBeenCalledWith(["a", "b"]);
  });

  it("有効な対象が無ければ del を呼ばない", async () => {
    await deleteImages([null, undefined]);
    await deleteImages([]);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("del が失敗しても例外を投げない", async () => {
    delMock.mockRejectedValue(new Error("boom"));
    await expect(deleteImages(["a"])).resolves.toBeUndefined();
  });
});
