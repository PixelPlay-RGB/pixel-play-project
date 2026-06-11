// 검색엔진 크롤링 규칙 — 공개 화면만 색인하고 개인·운영·오버레이 경로는 차단합니다.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/user/",
        // 크리에이터 스튜디오(본인 전용 운영 화면)
        "/channel/live",
        "/channel/chat",
        "/channel/donation",
        "/channel/security",
        "/channel/settlement",
        "/channel/analytics",
        // 채팅 팝업·OBS 오버레이(개인용 보조 화면)
        "/live/*/chat",
        "/live/*/alerts",
      ],
    },
    sitemap: "https://pixel-play.studio/sitemap.xml",
  };
}
