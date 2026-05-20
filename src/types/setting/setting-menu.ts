// setting-menu 도메인 타입을 정의합니다.
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

export type SettingMenuHandlers = {
  onClose?: () => void;
  onLogout: () => Promise<void>;
  isLogoutPending?: boolean;
  isActive?: (href: string) => boolean;
  actions?: Record<string, () => void | Promise<void>>;
};
