// 라이브 목록 페이지를 렌더링합니다.
import { getLiveHero } from "@/app/live/data";
import LiveHero from "@/components/live/live-hero";
import LiveList from "@/components/live/live-list";
import LiveShell from "@/components/live/live-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "라이브",
  description: "PixelPlay에서 진행 중인 라이브 방송을 둘러보세요.",
  openGraph: {
    title: "라이브 | PixelPlay",
    description: "PixelPlay에서 진행 중인 라이브 방송을 둘러보세요.",
    url: "/live",
    images: [
      {
        url: "/og-home.webp",
        width: 1200,
        height: 630,
        alt: "PixelPlay 라이브 썸네일",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "라이브 | PixelPlay",
    description: "PixelPlay에서 진행 중인 라이브 방송을 둘러보세요.",
    images: ["/og-home.webp"],
  },
};

export default async function LivePage() {
  const hero = await getLiveHero();

  return (
    <LiveShell>
      <LiveList heroSlot={<LiveHero hero={hero} />} />
    </LiveShell>
  );
}
