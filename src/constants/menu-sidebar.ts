import { MessageSquare, Radio } from "lucide-react";
import type { MenuSidebarItem } from "@/types/menu-sidebar";

export const MENU_SIDEBAR_ITEMS: MenuSidebarItem[] = [
  { key: "chat", label: "채팅", icon: MessageSquare },
  { key: "live", label: "라이브", icon: Radio },
];
