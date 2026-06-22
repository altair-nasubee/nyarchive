"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCatId } from "@/lib/format";
import { PawMark } from "@/components/PawMark";

type OwnedCat = { id: number; name: string; iconUrl: string | null };

export function BottomBar({ cats }: { cats: OwnedCat[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        {/* 猫追加 */}
        <Link
          href="/cats/new"
          aria-label="猫を追加"
          className={cn(
            "group flex shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1 outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <span
            className={cn(
              "grid size-12 place-items-center rounded-full border-2 border-dashed border-primary/60 text-primary",
              "transition-colors group-hover:border-primary group-hover:bg-primary/10",
              pathname === "/cats/new" && "bg-primary/15 border-primary",
            )}
          >
            <Plus className="size-6" />
          </span>
          <span className="text-[0.65rem] font-medium text-muted-foreground">
            猫追加
          </span>
        </Link>

        <span className="h-12 w-px shrink-0 bg-border/70" aria-hidden />

        {/* 自分の猫たち（水平スクロール） */}
        {cats.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            まだ猫がいません。左の「猫追加」から登録できます。
          </p>
        ) : (
          <ul className="scroll-soft flex flex-1 items-center gap-3 overflow-x-auto py-1">
            {cats.map((cat) => {
              const active = pathname === `/cats/${cat.id}`;
              return (
                <li key={cat.id} className="shrink-0">
                  <Link
                    href={`/cats/${cat.id}`}
                    title={`${cat.name}（No.${formatCatId(cat.id)}）`}
                    className="group flex flex-col items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl px-0.5"
                  >
                    <span
                      className={cn(
                        "relative grid size-12 place-items-center overflow-hidden rounded-full bg-secondary ring-2 transition-all",
                        active
                          ? "ring-primary"
                          : "ring-transparent group-hover:ring-primary/50",
                      )}
                    >
                      {cat.iconUrl ? (
                        <Image
                          src={cat.iconUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <PawMark className="size-6 text-muted-foreground" />
                      )}
                    </span>
                    <span className="max-w-14 truncate text-[0.65rem] text-muted-foreground">
                      {cat.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
