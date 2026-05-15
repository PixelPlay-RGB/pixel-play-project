// 설정 페이지 레이아웃 - SettingsShell로 사이드바와 콘텐츠 영역 구성

import { SettingShell } from "@/components/setting/setting-shell";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <SettingShell>{children}</SettingShell>;
}
