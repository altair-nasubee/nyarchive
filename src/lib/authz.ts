import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { User } from "@/lib/db/schema";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

/** 現在のセッションを取得（未ログインなら null）。 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** ログイン必須。未ログインなら /login へリダイレクト。 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

/** 管理者（オーナー）判定。ADMIN_EMAIL と一致するか。 */
export function isAdmin(user: Pick<User, "email"> | { email: string } | null | undefined): boolean {
  if (!user?.email) return false;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  return user.email.trim().toLowerCase() === adminEmail;
}

/**
 * 対象リソースの所有者本人、または管理者かどうか。
 * 猫・画像の作成／更新／削除の認可に使用する。
 */
export function canMutate(
  user: { email: string; id: string },
  ownerId: string,
): boolean {
  return user.id === ownerId || isAdmin(user);
}
