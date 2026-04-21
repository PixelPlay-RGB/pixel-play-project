import Footer from "@/components/common/footer";
import Header from "@/components/common/header";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/lib/providers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixelPlay - RGB",
  description: "화면의 최소 단위인 픽셀을 즐긴다! 화면에 보여지는 스트리밍 서비스를 즐겨보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        notoSans.variable,
      )}
      suppressHydrationWarning
    >
      <body className="bg-brand/5 dark:bg-background flex min-h-full flex-col">
        <Providers>
          <Toaster />
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
