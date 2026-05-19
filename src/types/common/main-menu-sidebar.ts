// main-menu-sidebar 도메인 타입을 정의합니다.
import type { LucideIcon } from "lucide-react";

export type MainMenuSidebarKey = "chat" | "live";

export type MainMenuSidebarItem = {
  key: MainMenuSidebarKey;
  label: string;
  icon: LucideIcon;
};
