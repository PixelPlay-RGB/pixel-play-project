// 채널 관리 사이드바 메뉴 타입을 정의합니다.
import type { LucideIcon } from "lucide-react";

export type ChannelMenuItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};
