// 라우트 레이아웃을 구성합니다.
import Header from "@/components/common/header";
import RouteAccentProvider from "@/components/common/route-accent-provider";
import RouteFooter from "@/components/common/route-footer";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/common/providers";
import RouteOverlayChromeController from "@/components/common/route-overlay-chrome-controller";
import LiveDataRouteRefresher from "@/components/live/live-data-route-refresher";
import { LiveMiniPlayerHost } from "@/components/live/mini-player/live-mini-player-host";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import AuthToastHandler from "@/components/auth/auth-toast-handler";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  weight: "variable",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pixel-play.studio"),
  title: {
    default: "PixelPlay - RGB",
    template: "%s | PixelPlay",
  },
  description: "화면의 최소 단위인 픽셀을 즐긴다! 화면에 보여지는 스트리밍 서비스를 즐겨보세요",
  openGraph: {
    type: "website",
    siteName: "PixelPlay",
    title: "PixelPlay - RGB",
    description: "화면의 최소 단위인 픽셀을 즐긴다! 실시간 채팅과 라이브를 즐겨보세요.",
    url: "/",
    images: [
      {
        url: "/og-home.webp",
        width: 1200,
        height: 630,
        alt: "PixelPlay 메인 썸네일",
      },
    ],
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelPlay - RGB",
    description: "화면의 최소 단위인 픽셀을 즐긴다! 실시간 채팅과 라이브를 즐겨보세요.",
    images: ["/og-home.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", notoSans.variable, geistMono.variable, "font-sans")}
      suppressHydrationWarning
    >
      <body className="bg-background dark:bg-background flex min-h-full flex-col">
        <Providers>
          <RouteAccentProvider>
            <RouteOverlayChromeController />
            <LiveDataRouteRefresher />
            <LiveMiniPlayerHost />
            <Toaster />
            <Header />
            <AuthToastHandler />
            {/* tabIndex=-1: 미니플레이어 닫기 등 플로팅 UI가 사라질 때 포커스를 회수하는 본문 랜드마크. */}
            <main tabIndex={-1} className="flex flex-1 flex-col">
              {children}
            </main>
            <RouteFooter />
          </RouteAccentProvider>
        </Providers>
      </body>
    </html>
  );
}
