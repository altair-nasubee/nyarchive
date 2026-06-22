"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

import type { GalleryOwner } from "@/lib/queries";
import { formatCatId } from "@/lib/format";
import { ImagePopup, type PopupImage } from "@/components/ImagePopup";
import { PawMark } from "@/components/PawMark";

export function Gallery({ owners }: { owners: GalleryOwner[] }) {
  const [selected, setSelected] = useState<PopupImage | null>(null);

  return (
    <>
      <div className="space-y-12">
        {owners.map((owner) => (
          <section key={owner.id} aria-label={`${owner.name} の猫`}>
            {/* 飼い主ドロワーの見出し */}
            <div className="mb-4 flex items-center gap-3">
              {owner.image ? (
                <Image
                  src={owner.image}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 rounded-full ring-1 ring-border"
                />
              ) : (
                <span className="grid size-7 place-items-center rounded-full bg-secondary text-xs">
                  {owner.name.slice(0, 1)}
                </span>
              )}
              <h2 className="font-heading text-lg font-bold">{owner.name}</h2>
              <span className="catalog-no text-xs text-muted-foreground">
                {owner.cats.length} 頭 ·{" "}
                {owner.cats.reduce((n, c) => n + c.images.length, 0)} 枚
              </span>
              <span className="h-px flex-1 bg-border/60" aria-hidden />
            </div>

            {/* 猫ごとのカラム（横スクロール） */}
            <div className="scroll-soft -mx-1 flex gap-4 overflow-x-auto px-1 pb-3">
              {owner.cats.map((cat) => (
                <article
                  key={cat.id}
                  className="paper-surface flex w-44 shrink-0 flex-col rounded-2xl p-3 text-paper-foreground shadow-lg shadow-black/20 ring-1 ring-black/5"
                >
                  <Link
                    href={`/cats/${cat.id}`}
                    className="group mb-3 flex items-center gap-2 outline-none"
                  >
                    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary ring-1 ring-black/10">
                      {cat.iconUrl ? (
                        <Image
                          src={cat.iconUrl}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <PawMark className="size-5 text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-heading text-sm font-bold leading-tight group-hover:text-primary">
                        {cat.name}
                      </span>
                      <span className="catalog-no block text-[0.65rem] text-ink-faint">
                        No.{formatCatId(cat.id)}
                        {cat.breed ? ` · ${cat.breed}` : ""}
                      </span>
                    </span>
                  </Link>

                  {/* サムネイル（縦に積む） */}
                  <div className="flex flex-col gap-2">
                    {cat.images.map((img) => (
                      <motion.button
                        key={img.id}
                        type="button"
                        whileHover={{ scale: 1.03, rotate: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          setSelected({
                            url: img.url,
                            catId: cat.id,
                            catName: cat.name,
                            ownerName: owner.name,
                            uploadedAt: img.uploadedAt,
                          })
                        }
                        className="relative aspect-square w-full overflow-hidden rounded-lg bg-secondary outline-none ring-offset-2 ring-offset-paper focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`${cat.name} の写真を拡大`}
                      >
                        <Image
                          src={img.url}
                          alt={`${cat.name} の写真`}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ImagePopup image={selected} onClose={() => setSelected(null)} />
    </>
  );
}
