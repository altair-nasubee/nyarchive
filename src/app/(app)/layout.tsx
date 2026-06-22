import Link from "next/link";

import { getOwnedCats } from "@/lib/queries";
import { isAdmin, requireUser } from "@/lib/authz";
import { BottomBar } from "@/components/BottomBar";
import { UserMenu } from "@/components/UserMenu";
import { PawMark } from "@/components/PawMark";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const ownedCats = await getOwnedCats(user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <PawMark className="size-5" />
            </span>
            <span className="font-heading text-xl font-bold tracking-tight">
              nyarchive
            </span>
          </Link>
          <UserMenu name={user.name} image={user.image} isAdmin={admin} />
        </div>
      </header>

      {/* BottomBar の高さぶん下に余白を確保 */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6">
        {children}
      </main>

      <BottomBar cats={ownedCats} />
    </div>
  );
}
