import Link from "next/link";

import { getGalleryData } from "@/lib/queries";
import { Gallery } from "@/components/Gallery";
import { PawMark } from "@/components/PawMark";
import { Button } from "@/components/ui/button";

// DB を直接読むため常に最新を表示
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const owners = await getGalleryData();

  return (
    <div>
      <div className="mb-8">
        <p className="catalog-no text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Gallery
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">
          みんなのねこ図鑑
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          縦に飼い主、横に猫。サムネイルをクリックすると拡大します。
        </p>
      </div>

      {owners.length === 0 ? (
        <EmptyGallery />
      ) : (
        <Gallery owners={owners} />
      )}
    </div>
  );
}

function EmptyGallery() {
  return (
    <div className="paper-surface mx-auto flex max-w-md flex-col items-center rounded-2xl px-8 py-12 text-center text-paper-foreground shadow-lg ring-1 ring-black/5">
      <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
        <PawMark className="size-7" />
      </span>
      <h2 className="mt-4 font-heading text-lg font-bold">
        まだ公開された写真がありません
      </h2>
      <p className="mt-2 text-sm text-ink-faint">
        最初の一頭を図鑑に登録しましょう。
        公開した写真がこのギャラリーに並びます。
      </p>
      <Button
        render={<Link href="/cats/new" />}
        nativeButton={false}
        className="mt-6"
      >
        猫を追加する
      </Button>
    </div>
  );
}
