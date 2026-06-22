import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  calcAge,
  formatAge,
  formatCatId,
  formatDate,
  toDateInputValue,
} from "@/lib/format";

describe("formatCatId", () => {
  it("4桁ゼロ埋めする", () => {
    expect(formatCatId(0)).toBe("0000");
    expect(formatCatId(7)).toBe("0007");
    expect(formatCatId(123)).toBe("0123");
  });

  it("4桁を超える場合はそのまま", () => {
    expect(formatCatId(12345)).toBe("12345");
  });
});

describe("calcAge / formatAge", () => {
  beforeEach(() => {
    // 「現在」を 2026-06-22 に固定して決定的にする
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("誕生日未設定(null/undefined)は null / 年齢不明", () => {
    expect(calcAge(null)).toBeNull();
    expect(calcAge(undefined)).toBeNull();
    expect(formatAge(null)).toBe("年齢不明");
  });

  it("未来の誕生日は null", () => {
    expect(calcAge(new Date("2027-01-01"))).toBeNull();
  });

  it("満年齢を算出する", () => {
    // 5年前ちょうど
    expect(calcAge(new Date("2021-06-22"))).toBe(5);
    expect(formatAge(new Date("2021-06-22"))).toBe("5歳");
  });

  it("誕生日前なら1歳引く（境界）", () => {
    // 2021-06-23 生まれ → 2026-06-22 時点ではまだ4歳
    expect(calcAge(new Date("2021-06-23"))).toBe(4);
    // 2021-06-21 生まれ → すでに5歳
    expect(calcAge(new Date("2021-06-21"))).toBe(5);
  });

  it("当日が0歳", () => {
    expect(calcAge(new Date("2026-06-22"))).toBe(0);
    expect(formatAge(new Date("2026-06-22"))).toBe("0歳");
  });
});

describe("formatDate", () => {
  it("YYYY.MM.DD 形式（ゼロ埋め）", () => {
    expect(formatDate(new Date("2024-01-05"))).toBe("2024.01.05");
    expect(formatDate(new Date("2026-12-31"))).toBe("2026.12.31");
  });

  it("未設定は —", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("toDateInputValue", () => {
  it("YYYY-MM-DD 形式（input[type=date] 用）", () => {
    expect(toDateInputValue(new Date("2024-01-05"))).toBe("2024-01-05");
  });

  it("未設定は空文字", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
  });
});
