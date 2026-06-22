import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CatProfileForm } from "@/components/CatProfileForm";

export default function NewCatPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        ギャラリーへ戻る
      </Link>

      <div className="mb-6">
        <p className="catalog-no text-xs uppercase tracking-[0.3em] text-muted-foreground">
          New Entry
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">
          猫を追加
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          プロフィールを登録すると番号が付与され、底部のバーに並びます。
        </p>
      </div>

      <CatProfileForm mode="create" />
    </div>
  );
}
