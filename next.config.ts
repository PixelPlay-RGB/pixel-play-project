import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Next.js 16부터 사용하는 next/image quality 값은 화이트리스트에 명시해야 한다.
    // 75(기본) + 90(채널 배너 등 화질 우선 표시).
    qualities: [75, 90],
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
