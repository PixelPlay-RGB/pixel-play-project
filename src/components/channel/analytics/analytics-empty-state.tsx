// 분석 화면의 빈/오프라인 상태(아이콘 + 제목 + 설명)를 공통 레이아웃으로 렌더링합니다.
// 통계 offline · 지난 방송 empty가 동일 레이아웃을 공유하므로 한 곳에서 관리한다.

import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function AnalyticsEmptyState({ icon: Icon, title, description }: Props) {
  return (
    <main className="flex min-h-full w-full -translate-y-4 flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="bg-live/10 text-live flex size-12 items-center justify-center rounded-xl">
        <Icon className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </main>
  );
}
