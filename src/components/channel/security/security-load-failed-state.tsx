// 채널 보안 설정을 불러오지 못한 상태를 렌더링합니다.
import { TriangleAlert } from "lucide-react";

export function SecurityLoadFailedState() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-10 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
        <TriangleAlert className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold">보안 정보를 불러오지 못했습니다.</h1>
        <p className="text-muted-foreground text-sm">
          다시 로그인한 뒤 시도하거나 잠시 후 새로고침해주세요.
        </p>
      </div>
    </main>
  );
}
