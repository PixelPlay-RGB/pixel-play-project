// 유저 설정 페이지 레이아웃을 구성합니다.
import type { Metadata } from "next";

import { SettingShell } from "@/components/setting/setting-shell";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";
import { ReactNode } from "react";

// 본인 전용 설정 화면이라 검색 색인에서 제외한다.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { profile } = await getCurrentProfileSnapshot();

  return <SettingShell profile={profile}>{children}</SettingShell>;
}
