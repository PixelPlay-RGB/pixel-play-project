import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 라이브 목록을 인덱스("/")로 옮겼으므로 구 목록 경로 /live 진입은 "/"로 보냅니다.
      // source "/live"는 정확히 /live만 매치합니다(=/live/[creatorId] 시청·/live/search 검색 등
      // 하위 경로는 정상 라우트라 영향 없음). 추후 정식 오픈 시 permanent: true로 올릴 수 있습니다.
      { source: "/live", destination: "/", permanent: false },
    ];
  },
  images: {
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
