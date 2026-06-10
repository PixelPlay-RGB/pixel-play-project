// 채널 관리 페이지 레이아웃을 구성합니다.
import type { Metadata } from "next";

import ChannelShell from "@/components/channel/channel-shell";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";
import { ReactNode } from "react";

// 크리에이터 본인 전용 스튜디오라 검색 색인에서 제외한다.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ChannelLayout({ children }: { children: ReactNode }) {
  const { profile } = await getCurrentProfileSnapshot();

  return <ChannelShell profile={profile}>{children}</ChannelShell>;
}
