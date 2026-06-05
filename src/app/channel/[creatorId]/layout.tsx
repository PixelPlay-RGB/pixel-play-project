// 공개 채널 페이지 셸 레이아웃. 크리에이터 프로필을 조회해 헤더/탭과 함께 렌더링합니다.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import ChannelPublicShell from "@/components/channel/public/channel-public-shell";
import { getChannelProfile } from "@/utils/channel/channel-server";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ creatorId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}): Promise<Metadata> {
  const { creatorId } = await params;
  const result = await getChannelProfile(creatorId);

  if (!result.success || !result.data) {
    return { title: "채널" };
  }

  return {
    title: `${result.data.nickname} 채널`,
    description: `${result.data.nickname}님의 PixelPlay 채널입니다.`,
  };
}

export default async function ChannelPublicLayout({ children, params }: LayoutProps) {
  const { creatorId } = await params;
  const result = await getChannelProfile(creatorId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ChannelPublicShell profile={result.data}>{children}</ChannelPublicShell>;
}
