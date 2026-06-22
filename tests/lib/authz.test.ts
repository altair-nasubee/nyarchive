import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// authz.ts はモジュール読み込み時に Better Auth / Next の API を import するため、
// 純粋関数（isAdmin / canMutate）だけを検証できるようモックする。
vi.mock("@/lib/auth", () => ({ auth: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { canMutate, isAdmin } from "@/lib/authz";

describe("isAdmin", () => {
  const original = process.env.ADMIN_EMAIL;
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.com";
  });
  afterEach(() => {
    process.env.ADMIN_EMAIL = original;
  });

  it("ADMIN_EMAIL と一致すれば true", () => {
    expect(isAdmin({ email: "admin@example.com" })).toBe(true);
  });

  it("大文字小文字・前後空白を無視して比較する", () => {
    expect(isAdmin({ email: "  Admin@Example.COM " })).toBe(true);
  });

  it("一致しなければ false", () => {
    expect(isAdmin({ email: "other@example.com" })).toBe(false);
  });

  it("user が null/undefined や email 空なら false", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin({ email: "" })).toBe(false);
  });

  it("ADMIN_EMAIL が未設定なら常に false", () => {
    delete process.env.ADMIN_EMAIL;
    expect(isAdmin({ email: "admin@example.com" })).toBe(false);
  });
});

describe("canMutate", () => {
  const original = process.env.ADMIN_EMAIL;
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.com";
  });
  afterEach(() => {
    process.env.ADMIN_EMAIL = original;
  });

  it("所有者本人なら true（管理者でなくても）", () => {
    const user = { id: "u1", email: "u1@example.com" };
    expect(canMutate(user, "u1")).toBe(true);
  });

  it("所有者でなくても管理者なら true", () => {
    const user = { id: "u2", email: "admin@example.com" };
    expect(canMutate(user, "owner-id")).toBe(true);
  });

  it("所有者でも管理者でもなければ false", () => {
    const user = { id: "u3", email: "u3@example.com" };
    expect(canMutate(user, "owner-id")).toBe(false);
  });
});
