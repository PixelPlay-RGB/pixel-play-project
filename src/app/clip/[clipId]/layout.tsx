// 클립 디테일 라우트 공통 레이아웃 — 클립 메타데이터(OG 세로 썸네일)를 제공합니다.
// (page의 generateMetadata는 body로 스트리밍되어 크롤러 외 클라이언트의 head에서 빠지므로 layout에 둔다.)
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getChannelProfile } from "@/utils/channel/channel-server";
import { getLiveClip } from "@/utils/clip/clip-server";

interface Props {
  params: Promise<{ clipId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clipId } = await params;
  const clip = await getLiveClip(clipId);

  if (!clip) {
    return { title: "클립" };
  }

  const profile = await getChannelProfile(clip.creatorId);
  const nickname = profile.success && profile.data ? profile.data.nickname : null;
  const description = nickname
    ? `${nickname}님의 라이브에서 잘라낸 클립을 감상해 보세요.`
    : "PixelPlay 라이브에서 잘라낸 클립을 감상해 보세요.";

  return {
    title: clip.title,
    description,
    openGraph: {
      title: clip.title,
      description,
      ...(clip.thumbnailUrl
        ? { images: [{ url: clip.thumbnailUrl, width: 720, height: 1280, alt: clip.title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: clip.title,
      description,
      ...(clip.thumbnailUrl ? { images: [clip.thumbnailUrl] } : {}),
    },
  };
}

export default async function ClipDetailLayout({
  children,
  params,
}: Props & { children: ReactNode }) {
  // 메타데이터를 본문과 함께 blocking 렌더시키기 위해 같은 데이터를 layout에서 미리 로드한다
  // (React cache로 generateMetadata와 중복 조회 없음). 스트리밍되면 meta가 head 밖으로 밀린다.
  const { clipId } = await params;
  await getLiveClip(clipId);

  return children;
}
