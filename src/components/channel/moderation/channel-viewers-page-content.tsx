"use client";
// 채널 시청자 관리 화면 — 강퇴/제재 이력 목록 + 해제. 데이터·상태·페이지네이션은 공유 섹션
// (ChannelViewerBanSection)이 소유하며, 라이브 유저관리 Dialog 와 같은 컴포넌트·훅·queryKey 를 쓴다.
// 다른 관리 라우터(매니저·채팅·이모지)와 결을 맞춰 좌측 목록 + 우측 사용 팁 2단으로 구성한다.

import { ShieldAlert } from "lucide-react";

import { ChannelViewerBanSection } from "@/components/channel/moderation/channel-viewer-ban-section";
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard } from "@/components/common/side-tip-card";
import { SideTipStep } from "@/components/common/side-tip-step";

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
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {/* 좌측 — 강퇴 목록 */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <ChannelViewerBanSection creatorId={creatorId} />
        </div>

        {/* 우측 — 사용 팁 */}
        <div className="flex min-w-0 flex-col gap-5 xl:w-120 xl:shrink-0">
          <SideTipCard
            icon={<ShieldAlert className="size-5" />}
            title="시청자를 제재하기 전에 확인해요"
            description={`강퇴는 채널의 모든 라이브 채팅에 영구 적용돼요.\n신중하게 쓰고, 상황이 바뀌면 바로 해제하세요.`}
          >
            <SideTipStep
              number="1"
              title="라이브 채팅에서 강퇴해요"
              description={`라이브 중 크리에이터와 매니저가 문제되는 시청자를 강퇴할 수 있어요.\n강퇴하면 그 즉시 채팅이 막혀요.`}
            />
            <SideTipStep
              number="2"
              title="채널 전체에 영구 적용돼요"
              description={`한 번 강퇴하면 이 채널의 모든 라이브에서 채팅이 차단돼요.\n방송이 바뀌어도 유지됩니다.`}
            />
            <SideTipStep
              number="3"
              title="필요 없어지면 해제해요"
              description={`여기 목록에서 언제든 해제할 수 있어요.\n해제하면 다시 채팅에 참여할 수 있어요.`}
            />
          </SideTipCard>
        </div>
      </div>
    </SettingsPage>
  );
}
