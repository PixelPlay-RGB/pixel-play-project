// 루트 폴백 OG 이미지(/og) — 공유 썸네일이 따로 없는 페이지(채널·게시글 등)가 layout 메타데이터로
// 상속해 쓰는 브랜드 카드. 콘텐츠가 고정이라 빌드 시 1회 생성해 정적으로 서빙한다.
import { ImageResponse } from "next/og";

import { BrandOgCard } from "@/utils/og/og-card";
import { OG_SIZE, loadKoreanOgFont } from "@/utils/og/og-assets";

export const dynamic = "force-static";

export async function GET() {
  const font = await loadKoreanOgFont("화면의 최소 단위, 픽셀을 즐긴다 PixelPlay");

  return new ImageResponse(<BrandOgCard />, {
    ...OG_SIZE,
    fonts: font ? [{ name: "Noto Sans KR", data: font, weight: 700, style: "normal" }] : [],
  });
}
