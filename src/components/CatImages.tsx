"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Maximize2, Plus, Trash2 } from "lucide-react";

import {
  deleteCatImage,
  toggleImageVisibility,
  uploadCatImage,
} from "@/actions/images";
import { ACCEPTED_IMAGE_TYPES, compressPhoto } from "@/lib/image";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImagePopup, type PopupImage } from "@/components/ImagePopup";

export type ManagedImage = {
  id: number;
  url: string;
  isPublic: boolean;
  uploadedAt: Date;
};

export function CatImages({
  catId,
  catName,
  ownerName,
  images,
  canMutate,
}: {
  catId: number;
  catName: string;
  ownerName: string;
  images: ManagedImage[];
  canMutate: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [popup, setPopup] = useState<PopupImage | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const selected = images.find((i) => i.id === selectedId) ?? null;

  function openEnlarge(img: ManagedImage) {
    setPopup({
      url: img.url,
      catId,
      catName,
      ownerName,
      uploadedAt: img.uploadedAt,
    });
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを再選択できるように
    if (!file) return;

    startTransition(async () => {
      try {
        const compressed = await compressPhoto(file);
        const fd = new FormData();
        fd.set("file", compressed);
        await uploadCatImage(catId, fd);
        toast.success("画像を追加しました。");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "アップロードに失敗しました。",
        );
      }
    });
  }

  function onToggle(id: number) {
    startTransition(async () => {
      try {
        await toggleImageVisibility(id);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "切り替えに失敗しました。",
        );
      }
    });
  }

  function onDelete(id: number) {
    startTransition(async () => {
      try {
        await deleteCatImage(id);
        setSelectedId(null);
        toast.success("画像を削除しました。");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "削除に失敗しました。",
        );
      }
    });
  }

  return (
    <div>
      {/* 画像追加アイコン ＋ サムネイルの水平スクロール */}
      <div className="scroll-soft flex items-stretch gap-3 overflow-x-auto pb-2">
        {canMutate && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              className={cn(
                "group flex aspect-square w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/50 text-primary",
                "transition hover:border-primary hover:bg-primary/10 disabled:opacity-50",
              )}
              aria-label="画像を追加"
            >
              <Plus className="size-7" />
              <span className="text-xs font-medium">
                {pending ? "処理中…" : "画像追加"}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={onPickFile}
              className="sr-only"
            />
          </>
        )}

        {images.length === 0 && !canMutate && (
          <p className="self-center text-sm text-muted-foreground">
            公開されている写真はまだありません。
          </p>
        )}

        {images.map((img) => {
          const active = img.id === selectedId;
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => {
                if (canMutate) {
                  setSelectedId(active ? null : img.id);
                } else {
                  openEnlarge(img);
                }
              }}
              className={cn(
                "relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-secondary outline-none ring-offset-2 ring-offset-background",
                "focus-visible:ring-2 focus-visible:ring-primary",
                active && "ring-2 ring-primary",
              )}
              aria-label={`${catName} の写真`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="112px"
                className={cn(
                  "object-cover transition",
                  !img.isPublic && "opacity-50",
                )}
              />
              {!img.isPublic && (
                <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
                  <EyeOff className="size-3" />
                  非公開
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 選択中の画像のコントロール（所有者のみ） */}
      {canMutate && selected && (
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-border/60 bg-secondary/40 p-4 sm:flex-row sm:items-center">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
            <Image
              src={selected.url}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <div className="catalog-no text-xs text-muted-foreground">
            アップロード日: {formatDate(selected.uploadedAt)}
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              {selected.isPublic ? (
                <Eye className="size-4 text-primary" />
              ) : (
                <EyeOff className="size-4 text-muted-foreground" />
              )}
              <span>{selected.isPublic ? "公開" : "非公開"}</span>
              <Switch
                checked={selected.isPublic}
                disabled={pending}
                onCheckedChange={() => onToggle(selected.id)}
                aria-label="公開・非公開を切り替え"
              />
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openEnlarge(selected)}
            >
              <Maximize2 className="size-4" />
              拡大
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => onDelete(selected.id)}
            >
              <Trash2 className="size-4" />
              削除
            </Button>
          </div>
        </div>
      )}

      <ImagePopup image={popup} onClose={() => setPopup(null)} />
    </div>
  );
}
