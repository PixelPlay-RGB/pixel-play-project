// 설정/데이터를 불러오지 못한 상태를 공통으로 렌더링합니다. code만 주입받습니다.

import { TriangleAlert } from "lucide-react";

import { getAppMessage } from "@/utils/common/app-message";

interface Props {
  code: Parameters<typeof getAppMessage>[0];
}

export function LoadFailedState({ code }: Props) {
  const message = getAppMessage(code);

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
