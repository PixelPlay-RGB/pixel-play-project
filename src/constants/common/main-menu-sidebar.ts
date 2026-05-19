// main-menu-sidebar 상수를 정의합니다.
import { MessageSquare, Radio } from "lucide-react";
import type { MainMenuSidebarItem } from "@/types/common/main-menu-sidebar";

export const MAIN_MENU_SIDEBAR_ITEMS: MainMenuSidebarItem[] = [
  { key: "chat", label: "채팅", icon: MessageSquare },
  { key: "live", label: "라이브", icon: Radio },
];
