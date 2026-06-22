"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera, Check } from "lucide-react";

import { setCatIcon } from "@/actions/cats";
import { cn } from "@/lib/utils";
import { PawMark } from "@/components/PawMark";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type IconPickerImage = { id: number; url: string };

/**
 * 猫のアイコンを「アップロード済みの公開画像」から選ぶ。
 * 「自動」を選ぶと未設定に戻り、最初の公開画像が自動採用される。
 */
export function CatIconPicker({
  catId,
  publicImages,
  currentIconUrl,
  iconImageId,
}: {
  catId: number;
  publicImages: IconPickerImage[];
  currentIconUrl: string | null;
  iconImageId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function select(imageId: number | null) {
    startTransition(async () => {
      try {
        await setCatIcon(catId, imageId);
        toast.success("アイコンを変更しました。");
        setOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "変更に失敗しました。",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col items-center gap-2">
        <DialogTrigger
          render={
            <button
              type="button"
              aria-label="アイコンを変更"
              className="group relative grid size-28 cursor-pointer place-items-center overflow-hidden rounded-full bg-secondary/60 ring-2 ring-black/10 outline-none transition hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-primary"
            />
          }
        >
          {currentIconUrl ? (
            <Image
              src={currentIconUrl}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <PawMark className="size-10 text-muted-foreground" />
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
            <Camera className="size-6" />
          </span>
        </DialogTrigger>
        <span className="text-[0.7rem] text-ink-faint">タップで変更</span>
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>アイコンに使う画像を選ぶ</DialogTitle>
          <DialogDescription>
            公開画像から選べます。「自動」にすると最初の画像が使われます。
          </DialogDescription>
        </DialogHeader>

        {publicImages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            公開画像がありません。先に画像を追加・公開してください。
          </p>
        ) : (
          <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto p-1">
            {/* 自動（未設定） */}
            <button
              type="button"
              disabled={pending}
              onClick={() => select(null)}
              className={cn(
                "relative grid aspect-square place-items-center rounded-lg border-2 border-dashed text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary",
                iconImageId === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/60",
              )}
            >
              {iconImageId === null && (
                <Check className="absolute right-1 top-1 size-4 text-primary" />
              )}
              自動
            </button>

            {publicImages.map((img) => {
              const selected = img.id === iconImageId;
              return (
                <button
                  key={img.id}
                  type="button"
                  disabled={pending}
                  onClick={() => select(img.id)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-lg outline-none ring-offset-2 ring-offset-popover focus-visible:ring-2 focus-visible:ring-primary",
                    selected && "ring-2 ring-primary",
                  )}
                  aria-label="この画像をアイコンにする"
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  {selected && (
                    <span className="absolute inset-0 grid place-items-center bg-primary/30">
                      <Check className="size-6 text-white drop-shadow" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
