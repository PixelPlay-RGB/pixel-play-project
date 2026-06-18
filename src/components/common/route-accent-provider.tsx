// 앱 공통 배경과 브랜드 CSS 변수 스코프를 제공합니다.

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function RouteAccentProvider({ children }: Props) {
  return <div className="app-shell-background flex min-h-dvh flex-1 flex-col">{children}</div>;
}
