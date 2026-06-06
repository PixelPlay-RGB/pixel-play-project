// 채널 통계를 불러오지 못한 상태를 렌더링합니다.

import { TriangleAlert } from "lucide-react";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getAppMessage } from "@/utils/common/app-message";

export function AnalyticsLoadFailedState() {
  const message = getAppMessage(APP_MESSAGE_CODE.error.channel.analyticsLoadFailed);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-10 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
        <TriangleAlert className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold">{message.title}</h1>
        <p className="text-muted-foreground text-sm">{message.description}</p>
      </div>
    </main>
  );
}
