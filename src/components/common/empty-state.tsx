// 빈 상태 공용 컴포넌트 — 브랜드 톤 아이콘 배지 + 제목 + 설명 + (선택)액션.
// 클립·기타 도메인에서 거의 동일하던 "아이콘 배지 + 안내 문구" 마크업을 한곳으로 모은다.

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
      <div className="bg-brand/10 text-brand ring-brand/5 flex size-16 items-center justify-center rounded-2xl ring-8">
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
