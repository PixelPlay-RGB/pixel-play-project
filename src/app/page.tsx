// 인덱스(홈) = 라이브 목록 페이지를 렌더링합니다.
import { getLiveHero } from "@/utils/live/live-hero-server";
import LiveHero from "@/components/live/live-hero";
import LiveList from "@/components/live/live-list";
import LiveShell from "@/components/live/live-shell";
import type { Metadata } from "next";

const HOME_METADATA_TITLE = "PixelPlay - RGB";
const HOME_METADATA_DESCRIPTION =
  "화면의 최소 단위인 픽셀을 즐긴다! PixelPlay에서 진행 중인 라이브 방송을 둘러보세요.";

export const metadata: Metadata = {
  title: {
    absolute: HOME_METADATA_TITLE,
  },
  description: HOME_METADATA_DESCRIPTION,
  openGraph: {
    title: HOME_METADATA_TITLE,
    description: HOME_METADATA_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "PixelPlay 메인 썸네일",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_METADATA_TITLE,
    description: HOME_METADATA_DESCRIPTION,
    images: ["/og"],
  },
};

export default async function Home() {
  const hero = await getLiveHero();

  return (
    <LiveShell>
      <LiveList heroSlot={<LiveHero hero={hero} />} heroId={hero?.id ?? null} />
    </LiveShell>
  );
}
