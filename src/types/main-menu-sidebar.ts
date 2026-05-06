import type { LucideIcon } from "lucide-react";

export type MainMenuSidebarKey = "chat" | "live";

export type MainMenuSidebarItem = {
  key: MainMenuSidebarKey;
  label: string;
  icon: LucideIcon;
};
