// 채널 관리 사이드바 메뉴 타입을 정의합니다.
import type { LucideIcon } from "lucide-react";

export type ChannelMenuChild = {
  id: string;
  label: string;
  href: string;
};

export type ChannelMenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: ChannelMenuChild[];
};
