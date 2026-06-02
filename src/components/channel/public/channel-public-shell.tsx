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
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <ChannelProfileHeader profile={profile} />
      <ChannelTabs creatorId={profile.id} />
      <div className="pt-6">{children}</div>
    </div>
  );
}
