import { MessageSquare, Radio } from "lucide-react";
import { MenuTabItem } from "@/types/menu-tab";

export const MENU_TABS: MenuTabItem[] = [
  { key: "chat", label: "채팅", icon: MessageSquare },
  { key: "live", label: "라이브", icon: Radio },
];

// 최대 정원
export const MAX_CAPACITY = 30;
// 최소 정원
export const MIN_CAPACITY = 2;