import { SettingMenuItem } from "@/types/setting-menu";
import { LogOut } from "lucide-react";

/**
 * 추후에 메뉴가 추가될 수도 있기에 미리 빼놓음
 */
export const SETTING_MENU: SettingMenuItem[] = [
  {
    id: "logout",
    type: "logout",
    label: "로그아웃",
    icon: LogOut,
  },
];
