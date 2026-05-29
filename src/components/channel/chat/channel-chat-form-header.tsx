// 채널 채팅 설정 폼의 제목과 저장 버튼을 렌더링합니다.

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  isSaving: boolean;
  canSubmit: boolean;
}

export function ChannelChatFormHeader({ isSaving, canSubmit }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-foreground text-2xl leading-8 font-bold tracking-tight">채팅 설정</h1>
        <p className="text-muted-foreground text-sm leading-6 text-pretty">
          방송 채팅의 기본 정책과 금칙어를 관리합니다.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isSaving || !canSubmit}
        className="bg-brand hover:bg-brand/85 text-white sm:w-24"
      >
        {isSaving ? <Spinner /> : "저장"}
      </Button>
    </div>
  );
}
