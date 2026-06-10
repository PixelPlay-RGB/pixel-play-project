// 설정 화면에서 반복되는 브랜드 톤 안내 문구를 렌더링합니다.

import { cn } from "@/lib/utils";
import { Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  icon?: LucideIcon | null;
  className?: string;
}

export function HintNote({ children, icon: Icon = Info, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-xs leading-5",
        "border-brand/15 bg-brand/10 text-muted-foreground",
        "dark:border-brand/30 dark:bg-brand/15 dark:text-foreground/85",
        className,
      )}
    >
      {Icon && (
        <span className="flex h-[1lh] shrink-0 items-center" aria-hidden>
          <Icon className="text-brand size-4" />
        </span>
      )}
      <p className="min-w-0 text-pretty">{children}</p>
    </div>
  );
}
