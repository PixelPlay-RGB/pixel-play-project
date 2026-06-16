// 채널 이모지 등록 화면(준비 중). 등록 UI·DB(스토리지·테이블)는 phase 2에서 붙인다.
import { Smile } from "lucide-react";

import { SettingsPage } from "@/components/common/settings-page";

export function ChannelEmojiPageContent() {
  return (
    <SettingsPage
      kicker="구독 · 이모지"
      title="채널 이모지를 등록해요"
      description={
        <>
          구독자가 채팅에서 쓸 수 있는 채널 전용 이모지를 등록하는 공간이에요.
          <br />곧 이미지 업로드와 슬롯 관리를 제공할 예정이에요.
        </>
      }
    >
      <div className="border-border bg-muted/20 text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
        <Smile className="size-8 opacity-70" />
        <p className="text-foreground text-sm font-semibold">이모지 등록 기능을 준비하고 있어요.</p>
        <p className="text-xs">조금만 기다려 주세요.</p>
      </div>
    </SettingsPage>
  );
}
