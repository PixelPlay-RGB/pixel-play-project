// 빈 상태 공용 컴포넌트 — 차분한 subtitle(muted) 톤 아이콘 배지 + 제목 + 설명 + (선택)액션.
// 빈 상태는 강조 대상이 아니므로 brand·live 등 강조색을 섞지 않고 muted 한 가지로만 통일한다.
// 도메인 곳곳에서 거의 동일하던 "아이콘 배지 + 안내 문구" 마크업을 한곳으로 모은다.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-20 text-center",
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-2xl">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-bold">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
