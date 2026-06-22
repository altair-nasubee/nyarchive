import { cn } from "@/lib/utils";

/** 肉球マーク。アクセント・スタンプ・ボタン等で使う。 */
export function PawMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      {/* 肉球（てのひら） */}
      <path d="M12 13.4c2.7 0 5.4 1.9 5.4 4.3 0 1.7-1.4 2.6-3 2.6-1 0-1.7-.4-2.4-.4s-1.4.4-2.4.4c-1.6 0-3-.9-3-2.6 0-2.4 2.7-4.3 5.4-4.3Z" />
      {/* 指の肉球 4つ */}
      <ellipse cx="6.4" cy="11" rx="1.7" ry="2.2" />
      <ellipse cx="10" cy="8.4" rx="1.7" ry="2.3" />
      <ellipse cx="14" cy="8.4" rx="1.7" ry="2.3" />
      <ellipse cx="17.6" cy="11" rx="1.7" ry="2.2" />
    </svg>
  );
}
