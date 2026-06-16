// 라이브 시청 라우트 공통 레이아웃 — 시청 메타데이터를 제공합니다.
// (page의 generateMetadata는 body로 스트리밍되어 크롤러 외 클라이언트의 head에서 빠지므로 layout에 둔다.)
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getChannelProfile } from "@/utils/channel/channel-server";

interface Props {
  params: Promise<{ creatorId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { creatorId } = await params;
  const result = await getChannelProfile(creatorId);

  if (!result.success || !result.data) {
    return { title: "라이브" };
  }

  const { nickname, isLive } = result.data;

  return {
    title: isLive ? `${nickname}의 라이브` : `${nickname}의 라이브 채널`,
    description: `${nickname}님의 PixelPlay 라이브 방송을 실시간 채팅과 함께 시청해 보세요.`,
  };
}

export default async function LiveWatchLayout({
  children,
  params,
}: Props & { children: ReactNode }) {
  // 메타데이터를 본문과 함께 blocking 렌더시키기 위해 같은 데이터를 layout에서 미리 로드한다
  // (React cache로 generateMetadata와 중복 조회 없음). 스트리밍되면 meta가 head 밖으로 밀린다.
  const { creatorId } = await params;
  await getChannelProfile(creatorId);

  return children;
}
