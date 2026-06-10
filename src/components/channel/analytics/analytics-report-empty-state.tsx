// 종료된 방송이 아직 없을 때의 지난 방송 분석 상태를 렌더링합니다.

import { History } from "lucide-react";

import { ANALYTICS_LABEL } from "@/constants/channel/analytics";

export function AnalyticsReportEmptyState() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-10 text-center">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
        <History className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold">{ANALYTICS_LABEL.reportEmptyTitle}</h1>
        <p className="text-muted-foreground text-sm">{ANALYTICS_LABEL.reportEmptyDescription}</p>
      </div>
    </main>
  );
}
