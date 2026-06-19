// 라이브 시청 페이지의 동적 OG 이미지 — 공유 링크에 그 방송 썸네일·제목·크리에이터가 보이게 한다.
// (공유 버튼이 실제 존재하는 페이지라 콘텐츠 맞춤 카드를 만든다. 그 외 페이지는 루트 /og 폴백을 상속.)
import { ImageResponse } from "next/og";

import { getChannelLiveHero } from "@/utils/channel/channel-extras-server";
import { getChannelProfile } from "@/utils/channel/channel-server";
import { LiveOgCard } from "@/utils/og/og-card";
import {
  OG_SIZE,
  loadKoreanOgFont,
  loadOgImageDataUrl,
  toAbsoluteOgUrl,
} from "@/utils/og/og-assets";

export const alt = "PixelPlay 라이브";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function LiveOpengraphImage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  const profileResult = await getChannelProfile(creatorId);
  const profile = profileResult.success ? profileResult.data : null;
  const nickname = profile?.nickname?.trim() || "PixelPlay";
  const isLive = profile?.isLive ?? false;

  // 방송 제목·썸네일은 라이브 중일 때만 의미가 있다(viewerId 없이 비로그인 크롤러로 조회).
  const hero = isLive ? await getChannelLiveHero(creatorId) : null;
  const title =
    hero?.title?.trim() || (isLive ? `${nickname}의 라이브` : `${nickname}의 라이브 채널`);

  // 실제 방송 썸네일이 있을 때만 배경으로 쓴다(없으면 카드가 브랜드 그라데이션으로 폴백).
  const thumbnailDataUrl =
    isLive && hero?.thumbnailUrl
      ? await loadOgImageDataUrl(toAbsoluteOgUrl(hero.thumbnailUrl))
      : null;

  const font = await loadKoreanOgFont(`${title}${nickname}의 라이브 채널 PixelPlay`);

  return new ImageResponse(
    <LiveOgCard
      nickname={nickname}
      title={title}
      isLive={isLive}
      thumbnailDataUrl={thumbnailDataUrl}
    />,
    {
      ...OG_SIZE,
      fonts: font ? [{ name: "Noto Sans KR", data: font, weight: 700, style: "normal" }] : [],
    },
  );
}
