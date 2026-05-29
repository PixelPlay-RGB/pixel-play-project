// 라이브 목록의 오류 상태를 렌더링합니다.

import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getAppMessage } from "@/utils/common/app-message";

interface LiveListErrorStateProps {
  onRetry: () => void;
}

export default function LiveListErrorState({ onRetry }: LiveListErrorStateProps) {
  const message = getAppMessage(APP_MESSAGE_CODE.error.liveList.loadFailed);

  return (
    <div className="border-border bg-card flex min-h-72 flex-col items-center justify-center rounded-lg border px-5 py-12 text-center">
      <h2 className="text-foreground text-lg font-bold">{message.title}</h2>
      <p className="text-muted-foreground mt-2 max-w-90 text-sm leading-relaxed">
        {message.description}
      </p>
      <Button type="button" variant="outline" size="lg" className="mt-5" onClick={onRetry}>
        <RotateCw className="size-4" />
        다시 불러오기
      </Button>
    </div>
  );
}
