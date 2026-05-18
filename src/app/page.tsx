// 라우트 페이지를 렌더링합니다.
import MainMenuSidebar from "@/components/common/main-menu-sidebar";
import type { Metadata } from "next";

const HOME_METADATA_TITLE = "실시간 채팅과 라이브 상호작용";
const HOME_METADATA_DESCRIPTION =
  "PixelPlay에서 채팅방을 만들고 참여하며 실시간 소통을 즐겨보세요.";

export const metadata: Metadata = {
  title: HOME_METADATA_TITLE,
  description: HOME_METADATA_DESCRIPTION,
  openGraph: {
    title: `${HOME_METADATA_TITLE} | PixelPlay`,
    description: HOME_METADATA_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/og-home.webp",
        width: 1200,
        height: 630,
        alt: "PixelPlay 실시간 상호작용 메인 화면",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${HOME_METADATA_TITLE} | PixelPlay`,
    description: HOME_METADATA_DESCRIPTION,
    images: ["/og-home.webp"],
  },
};

export default function Home() {
  return <MainMenuSidebar />;
}
