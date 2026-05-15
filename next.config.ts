import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
