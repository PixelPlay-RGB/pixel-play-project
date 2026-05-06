import { LucideIcon } from "lucide-react";

type SettingMenuItemBase = {
  id: string;
  label: string;
  icon?: LucideIcon;
  sidebarOnly?: boolean;
};

export type SettingMenuItem =
  | (SettingMenuItemBase & { type: "link"; href: string })
  | (SettingMenuItemBase & { type: "action" })
  | (SettingMenuItemBase & { type: "logout" })
  | (SettingMenuItemBase & { type: "changePassword" });
