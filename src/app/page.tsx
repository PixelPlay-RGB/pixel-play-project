// 라우트 페이지를 렌더링합니다.
import MainMenuSidebar from "@/components/common/main-menu-sidebar";
import PublicHomePreview from "@/components/public/public-home-preview";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";
import type { Metadata } from "next";

const HOME_METADATA_TITLE = "PixelPlay - RGB";
const HOME_METADATA_DESCRIPTION =
  "화면의 최소 단위인 픽셀을 즐긴다! 화면에 보여지는 스트리밍 서비스를 즐겨보세요";

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
        url: "/og-home.webp",
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
    images: ["/og-home.webp"],
  },
};

export default async function Home() {
  const { profile } = await getCurrentProfileSnapshot();

  if (!profile) {
    return <PublicHomePreview />;
  }

  return <MainMenuSidebar />;
}
