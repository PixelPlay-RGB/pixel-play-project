// 유저 설정 페이지 레이아웃을 구성합니다.
import { SettingShell } from "@/components/setting/setting-shell";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";
import { ReactNode } from "react";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { profile } = await getCurrentProfileSnapshot();

  return <SettingShell profile={profile}>{children}</SettingShell>;
}
