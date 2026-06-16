"use client";
// 채널 시청자 관리 화면 — 강퇴/제재 이력 목록 + 해제. 데이터·상태·페이지네이션은 공유 섹션
// (ChannelViewerBanSection)이 소유하며, 라이브 유저관리 Dialog 와 같은 컴포넌트·훅·queryKey 를 쓴다.

import { ChannelViewerBanSection } from "@/components/channel/moderation/channel-viewer-ban-section";
import { SettingsPage } from "@/components/common/settings-page";

interface Props {
  creatorId: string;
}

export function ChannelViewersPageContent({ creatorId }: Props) {
  return (
    <SettingsPage
      kicker="시청자 관리"
      title="강퇴한 시청자를 관리해요"
      description={
        <>
          라이브 채팅에서 현재 강퇴 중인 시청자를 한곳에서 확인할 수 있어요.
          <br />
          강퇴는 채널 전체에 영구 적용되며, 필요하면 언제든 해제할 수 있어요.
        </>
      }
    >
      <ChannelViewerBanSection creatorId={creatorId} />
    </SettingsPage>
  );
}
