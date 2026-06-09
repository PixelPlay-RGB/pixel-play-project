// 채널 관리 페이지 레이아웃을 구성합니다.
import ChannelShell from "@/components/channel/channel-shell";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";
import { ReactNode } from "react";

export default async function ChannelLayout({ children }: { children: ReactNode }) {
  const { profile } = await getCurrentProfileSnapshot();

  return <ChannelShell profile={profile}>{children}</ChannelShell>;
}
