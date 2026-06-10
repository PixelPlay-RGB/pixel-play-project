// 라우트 레이아웃을 구성합니다.
import type { Metadata } from "next";

// 인증 화면은 개인 흐름이라 검색 색인에서 제외한다.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center py-6 sm:py-12 dark:bg-transparent">
      <div className="bg-auth-grid absolute inset-0 opacity-15 dark:opacity-10" />
      <div className="bg-auth-vignette absolute inset-0" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
