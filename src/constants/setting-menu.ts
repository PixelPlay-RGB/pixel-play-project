// setting-menu 상수를 정의합니다.
import { SettingMenuItem } from "@/types/setting-menu";
import { Key, LogOut, User } from "lucide-react";

export const SETTING_MENU: SettingMenuItem[] = [
  {
    id: "profile",
    type: "link",
    label: "프로필",
    href: "/profile",
    icon: User,
    sidebarOnly: true,
  },
  {
    id: "changePassword",
    type: "changePassword",
    label: "비밀번호 변경",
    icon: Key,
  },
  {
    id: "logout",
    type: "logout",
    label: "로그아웃",
    icon: LogOut,
  },
];
