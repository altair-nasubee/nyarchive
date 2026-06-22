import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCatWithImages } from "@/lib/queries";
import { isAdmin, requireUser } from "@/lib/authz";
import { formatAge, formatCatId, formatDate } from "@/lib/format";
import { CatProfileForm } from "@/components/CatProfileForm";
import { CatImages } from "@/components/CatImages";
import { DeleteCatButton } from "@/components/DeleteCatButton";
import { PawMark } from "@/components/PawMark";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catId = Number(id);
  if (!Number.isInteger(catId)) notFound();

  const viewer = await requireUser();
  const admin = isAdmin(viewer);
  const cat = await getCatWithImages(catId, { id: viewer.id, isAdmin: admin });
  if (!cat) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        ギャラリーへ戻る
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="catalog-no rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground">
          No.{formatCatId(cat.id)}
        </span>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {cat.name}
        </h1>
        {cat.canMutate && admin && viewer.id !== cat.ownerId && (
          <Badge variant="secondary">管理者として編集中</Badge>
        )}
      </div>

      {/* プロフィール */}
      {cat.canMutate ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">プロフィール</h2>
            <DeleteCatButton
              catId={cat.id}
              catName={cat.name}
              imageCount={cat.images.length}
            />
          </div>
          <CatProfileForm
            mode="edit"
            cat={{
              id: cat.id,
              name: cat.name,
              breed: cat.breed,
              birthDate: cat.birthDate,
              personality: cat.personality,
              likes: cat.likes,
              dislikes: cat.dislikes,
              iconUrl: cat.iconUrl,
            }}
          />
        </section>
      ) : (
        <ReadOnlyProfile cat={cat} />
      )}

      {/* 画像 */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-bold">写真</h2>
          <span className="catalog-no text-xs text-muted-foreground">
            {cat.images.length} 枚
          </span>
        </div>
        <CatImages
          catId={cat.id}
          catName={cat.name}
          ownerName={cat.ownerName}
          canMutate={cat.canMutate}
          images={cat.images.map((i) => ({
            id: i.id,
            url: i.url,
            isPublic: i.isPublic,
            uploadedAt: i.uploadedAt,
          }))}
        />
      </section>
    </div>
  );
}

function ReadOnlyProfile({
  cat,
}: {
  cat: Awaited<ReturnType<typeof getCatWithImages>>;
}) {
  if (!cat) return null;
  const rows: [string, string | null][] = [
    ["種類", cat.breed],
    ["年齢", formatAge(cat.birthDate)],
    ["誕生日", cat.birthDate ? formatDate(cat.birthDate) : null],
    ["性格", cat.personality],
    ["好きなもの", cat.likes],
    ["嫌いなもの", cat.dislikes],
  ];

  return (
    <section className="paper-surface rounded-2xl p-6 text-paper-foreground shadow-lg ring-1 ring-black/5">
      <div className="flex items-center gap-4">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary/60 ring-1 ring-black/10">
          {cat.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cat.iconUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <PawMark className="size-7 text-muted-foreground" />
          )}
        </span>
        <div>
          <p className="font-heading text-xl font-bold">{cat.name}</p>
          <p className="catalog-no text-xs text-ink-faint">
            {cat.ownerName} のねこ図鑑
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between border-b border-dashed border-ink-faint/25 pb-2"
          >
            <dt className="text-sm text-ink-faint">{label}</dt>
            <dd className="text-sm font-medium">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
