// 채널 공통 레이아웃: 라이브 목록과 동일한 사이드바/콘텐츠 컨테이너(LiveShell)만 제공한다.
// 공개 프로필 헤더+탭은 (public) 그룹에서만 적용해 관리(setting) 페이지엔 노출하지 않는다.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import LiveShell from "@/components/live/live-shell";
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

export default async function ChannelLayout({ children, params }: LayoutProps) {
  const { creatorId } = await params;
  const result = await getChannelProfile(creatorId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <LiveShell mobileTitle="채널">{children}</LiveShell>;
}
