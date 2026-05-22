// 라이브 검색 페이지를 렌더링합니다.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "라이브 검색",
  description: "PixelPlay에서 라이브 방송을 검색합니다.",
};

export default function LiveSearchPage() {
  return (
    <div className="min-h-app-content mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-5 md:px-6 md:py-8">
      <div>라이브 검색 페이지</div>
    </div>
  );
}
