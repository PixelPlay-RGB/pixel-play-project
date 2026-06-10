// 정적 핵심 경로 사이트맵 — 동적(채널·방송) 경로는 목록 화면을 통해 발견됩니다.
import type { MetadataRoute } from "next";

const BASE_URL = "https://pixel-play.studio";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "always",
      priority: 1,
    },
    {
      url: `${BASE_URL}/live/search`,
      changeFrequency: "daily",
      priority: 0.6,
    },
  ];
}
