"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createCat, updateCat } from "@/actions/cats";
import { BREED_PRESETS } from "@/lib/breeds";
import { toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CatFormDefaults = {
  id: number;
  name: string;
  breed: string | null;
  birthDate: Date | null;
  personality: string | null;
  likes: string | null;
  dislikes: string | null;
};

export function CatProfileForm({
  mode,
  cat,
}: {
  mode: "create" | "edit";
  cat?: CatFormDefaults;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
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
      <div className="space-y-4">
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
          {pending ? "保存中…" : mode === "create" ? "決定" : "変更"}
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
