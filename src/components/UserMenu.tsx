"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function UserMenu({
  name,
  image,
  isAdmin,
}: {
  name: string;
  image?: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {image ? (
          <Image
            src={image}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full ring-1 ring-border"
          />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
            {name.slice(0, 1)}
          </span>
        )}
        <div className="hidden text-sm leading-tight sm:block">
          <span className="block max-w-[10rem] truncate font-medium">
            {name}
          </span>
          {isAdmin && (
            <Badge
              variant="default"
              className="mt-0.5 h-4 px-1.5 text-[0.6rem] uppercase tracking-wide"
            >
              管理者
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        disabled={pending}
        aria-label="ログアウト"
        title="ログアウト"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
