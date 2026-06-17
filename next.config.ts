import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 비동기 generateMetadata는 기본적으로 body로 스트리밍되는데, JS를 못 돌리는 클라이언트는
  // head의 메타만 읽는다. 기본 봇 목록에 Lighthouse를 더해 이런 클라이언트에는 blocking으로 제공한다.
  htmlLimitedBots:
    /Chrome-Lighthouse|Mediapartners-Google|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview/i,
  async redirects() {
    return [
      // 라이브 목록을 인덱스("/")로 옮겼으므로 구 목록 경로 /live 진입은 "/"로 보냅니다.
      // source "/live"는 정확히 /live만 매치합니다(=/live/[creatorId] 시청·/live/search 검색 등
      // 하위 경로는 정상 라우트라 영향 없음). 추후 정식 오픈 시 permanent: true로 올릴 수 있습니다.
      { source: "/live", destination: "/", permanent: false },
    ];
  },
  images: {
    localPatterns: [
      {
        pathname: "/subscription-badges/**",
        search: "?v=20260615-fixed-slots-v1",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ftvoynnfpfzmblgrntqj.supabase.co",
      },
      {
        protocol: "https",
        hostname: "pixel-play.studio",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
