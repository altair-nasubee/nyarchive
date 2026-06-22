"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";

import { createCat, updateCat } from "@/actions/cats";
import { BREED_PRESETS } from "@/lib/breeds";
import { ACCEPTED_IMAGE_TYPES, compressIcon } from "@/lib/image";
import { toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PawMark } from "@/components/PawMark";

export type CatFormDefaults = {
  id: number;
  name: string;
  breed: string | null;
  birthDate: Date | null;
  personality: string | null;
  likes: string | null;
  dislikes: string | null;
  iconUrl: string | null;
};

export function CatProfileForm({
  mode,
  cat,
}: {
  mode: "create" | "edit";
  cat?: CatFormDefaults;
}) {
  const [pending, startTransition] = useTransition();
  const [iconPreview, setIconPreview] = useState<string | null>(
    cat?.iconUrl ?? null,
  );
  const iconFileRef = useRef<File | null>(null);

  function onIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    iconFileRef.current = file;
    setIconPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    // ネイティブの file 入力は圧縮版に差し替える
    fd.delete("icon");

    startTransition(async () => {
      try {
        if (iconFileRef.current) {
          const compressed = await compressIcon(iconFileRef.current);
          fd.set("icon", compressed);
        }
        if (mode === "create") {
          await createCat(fd);
          // 成功時は createCat 内で /cats/[id] へリダイレクト
        } else if (cat) {
          await updateCat(cat.id, fd);
          toast.success("プロフィールを更新しました。");
        }
      } catch (err) {
        // redirect() は例外として投げられるため、そのまま再スロー
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          typeof (err as { digest?: string }).digest === "string" &&
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        toast.error(
          err instanceof Error ? err.message : "保存に失敗しました。",
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="paper-surface rounded-2xl p-6 text-paper-foreground shadow-lg ring-1 ring-black/5 sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* アイコン */}
        <div className="flex flex-col items-center gap-2">
          <Label className="self-start text-ink-faint">アイコン</Label>
          <label className="group relative grid size-28 cursor-pointer place-items-center overflow-hidden rounded-full bg-secondary/60 ring-2 ring-black/10 transition hover:ring-primary/60">
            {iconPreview ? (
              <Image
                src={iconPreview}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <PawMark className="size-10 text-muted-foreground" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
              <Camera className="size-6" />
            </span>
            <input
              type="file"
              name="icon"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={onIconChange}
              className="sr-only"
            />
          </label>
          <span className="text-[0.7rem] text-ink-faint">クリックで選択</span>
        </div>

        {/* 基本情報 */}
        <div className="flex-1 space-y-4">
          <Field label="名前" htmlFor="name" required>
            <Input
              id="name"
              name="name"
              required
              maxLength={40}
              defaultValue={cat?.name ?? ""}
              placeholder="例：たま"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="種類" htmlFor="breed">
              <Input
                id="breed"
                name="breed"
                list="breed-presets"
                defaultValue={cat?.breed ?? ""}
                placeholder="選択 or 自由入力"
              />
              <datalist id="breed-presets">
                {BREED_PRESETS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Field>

            <Field label="誕生日" htmlFor="birthDate">
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={toDateInputValue(cat?.birthDate)}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="性格" htmlFor="personality">
          <Textarea
            id="personality"
            name="personality"
            rows={3}
            defaultValue={cat?.personality ?? ""}
            placeholder="甘えん坊、マイペース…"
          />
        </Field>
        <Field label="好きなもの" htmlFor="likes">
          <Textarea
            id="likes"
            name="likes"
            rows={3}
            defaultValue={cat?.likes ?? ""}
            placeholder="ちゅ〜る、窓辺…"
          />
        </Field>
        <Field label="嫌いなもの" htmlFor="dislikes">
          <Textarea
            id="dislikes"
            name="dislikes"
            rows={3}
            defaultValue={cat?.dislikes ?? ""}
            placeholder="掃除機、病院…"
          />
        </Field>
      </div>

      <div className="mt-7 flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending
            ? "保存中…"
            : mode === "create"
              ? "決定"
              : "変更"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-ink-faint">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </Label>
      {children}
    </div>
  );
}
