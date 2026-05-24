// 라이브 목록 페이지를 렌더링합니다.
import LiveList from "@/components/live/live-list";
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

export default function LivePage() {
  return (
    <div className="min-h-app-content mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-5 md:px-6 md:py-8">
      <LiveList />
    </div>
  );
}
