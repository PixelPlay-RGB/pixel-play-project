// 공개 채널 페이지의 공통 레이아웃(헤더 + 탭 + 본문)을 구성합니다.
import type { ReactNode } from "react";

import ChannelProfileHeader from "@/components/channel/public/channel-profile-header";
import ChannelTabs from "@/components/channel/public/channel-tabs";
import type { ChannelProfile } from "@/types/channel/channel";

interface Props {
  profile: ChannelProfile;
  children: ReactNode;
}

export default function ChannelPublicShell({ profile, children }: Props) {
  // 공개 채널은 전역 사이드바(LiveShell) 없이 독립 레이아웃으로 렌더된다.
  // 초고해상도(>1920)에서 헤더·탭·피드가 과하게 늘어나지 않도록 1920(max-w-480)로 캡+중앙정렬한다.
  return (
    <div className="mx-auto w-full max-w-480">
      <ChannelProfileHeader profile={profile} />
      <ChannelTabs creatorId={profile.id} />
      <div className="pt-6">{children}</div>
    </div>
  );
}
