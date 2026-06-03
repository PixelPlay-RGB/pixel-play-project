// 진행 중인 방송이 없을 때의 통계 화면 상태를 렌더링합니다.

import { RadioTower } from "lucide-react";

import { ANALYTICS_LABEL } from "@/constants/channel/analytics";

export function AnalyticsOfflineState() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-10 text-center">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
        <RadioTower className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold">{ANALYTICS_LABEL.offlineTitle}</h1>
        <p className="text-muted-foreground text-sm">{ANALYTICS_LABEL.offlineDescription}</p>
      </div>
    </main>
  );
}
