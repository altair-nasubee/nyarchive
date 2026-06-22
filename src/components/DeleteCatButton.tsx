"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteCat } from "@/actions/cats";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteCatButton({
  catId,
  catName,
  imageCount,
}: {
  catId: number;
  catName: string;
  imageCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCat(catId);
        // 成功時は deleteCat 内で "/" へリダイレクト
      } catch (err) {
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
          err instanceof Error ? err.message : "削除に失敗しました。",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" className="text-destructive" />}
      >
        <Trash2 className="size-4" />
        削除
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>「{catName}」を削除しますか？</DialogTitle>
          <DialogDescription>
            プロフィールと、登録済みの画像 {imageCount} 枚をすべて削除します。
            この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={pending} />}
          >
            キャンセル
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "削除中…" : "削除する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
