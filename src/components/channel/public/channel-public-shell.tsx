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
  // 라이브 목록과 동일한 사이드바/콘텐츠 컨테이너(LiveShell) 안에서 렌더되므로
  // 자체 max-width·여백 없이 라이브 목록과 같은 콘텐츠 영역을 가득 채운다.
  return (
    <div className="w-full">
      <ChannelProfileHeader profile={profile} />
      <ChannelTabs creatorId={profile.id} />
      <div className="pt-6">{children}</div>
    </div>
  );
}
