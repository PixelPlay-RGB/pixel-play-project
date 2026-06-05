// 공개 채널(홈/커뮤니티) 레이아웃: 프로필 헤더 + 탭을 제공한다. 관리(setting) 페이지엔 적용되지 않는다.
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import ChannelPublicShell from "@/components/channel/public/channel-public-shell";
import { getChannelProfile } from "@/utils/channel/channel-server";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ creatorId: string }>;
}

export default async function ChannelPublicLayout({ children, params }: LayoutProps) {
  const { creatorId } = await params;
  const result = await getChannelProfile(creatorId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ChannelPublicShell profile={result.data}>{children}</ChannelPublicShell>;
}
