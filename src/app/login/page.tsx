import { redirect } from "next/navigation";

import { getSession } from "@/lib/authz";
import { SignInButton } from "@/components/SignInButton";
import { PawMark } from "@/components/PawMark";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) redirect("/");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* 展示壁にうっすら並ぶ肉球 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 2px, transparent 0)",
          backgroundSize: "44px 44px",
          color: "var(--foreground)",
        }}
      />

      <section className="paper-surface relative w-full max-w-md rounded-[1.6rem] px-8 py-10 text-paper-foreground shadow-2xl shadow-black/40 ring-1 ring-black/5">
        {/* マスキングテープ */}
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 -rotate-2 rounded-[2px] bg-tape shadow-sm"
        />

        {/* 受領印（肉球スタンプ） */}
        <div
          aria-hidden
          className="absolute right-6 top-6 flex size-16 rotate-12 items-center justify-center rounded-full border-2 border-primary/70 text-primary/80"
        >
          <PawMark className="size-8" />
        </div>

        <p className="catalog-no text-xs uppercase tracking-[0.3em] text-ink-faint">
          Cat Encyclopedia
        </p>
        <h1 className="mt-3 font-heading text-5xl font-bold leading-none tracking-tight">
          nyarchive
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-faint">
          Myねこのアーカイブ。Myねこの思い出をアップロードして、みんなで眺めましょう。
        </p>

        <hr className="my-7 border-dashed border-ink-faint/30" />

        <dl className="catalog-no mb-8 grid grid-cols-3 gap-3 text-[0.7rem] text-ink-faint">
          <div>
            <dt className="uppercase tracking-widest">No.</dt>
            <dd className="mt-0.5 text-base text-paper-foreground">————</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest">Filed by</dt>
            <dd className="mt-0.5 text-base text-paper-foreground">you</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest">Status</dt>
            <dd className="mt-0.5 text-base text-paper-foreground">new</dd>
          </div>
        </dl>

        <SignInButton />

        <p className="mt-5 text-xs leading-relaxed text-ink-faint">
          ログインすると、あなたの猫を登録・公開できます。
          ほかの飼い主が公開した猫の写真も閲覧できます。
        </p>
      </section>
    </main>
  );
}
