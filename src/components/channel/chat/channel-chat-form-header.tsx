// 채널 채팅 설정 폼의 제목과 저장 버튼을 렌더링합니다.

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  isSaving: boolean;
  canSubmit: boolean;
}

export function ChannelChatFormHeader({ isSaving, canSubmit }: Props) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex max-w-3xl flex-col gap-2">
        <span className="text-brand text-sm font-bold">방송 채팅 관리</span>
        <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight">
          채팅 규칙을 편하게 관리해요
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6 text-pretty">
          시청자가 채팅을 시작하기 전에 필요한 기준을 정해요.
          <br />
          참여 범위, 채팅 속도, 금칙어를 한곳에서 관리할 수 있어요.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isSaving || !canSubmit}
        className="bg-brand hover:bg-brand/85 text-white"
      >
        {isSaving ? <Spinner /> : "저장"}
      </Button>
    </section>
  );
}
