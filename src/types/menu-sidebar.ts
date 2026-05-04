import type { LucideIcon } from "lucide-react";

export type MenuSidebarKey = "chat" | "live";

export type MenuSidebarItem = {
  key: MenuSidebarKey;
  label: string;
  icon: LucideIcon;
};
