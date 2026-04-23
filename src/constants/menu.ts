import { ProfileMenuItem } from "@/types/menu";
import { LogOut } from "lucide-react";

/**
 * 추후에 메뉴가 추가될 수도 있기에 미리 빼놓음
 */
export const PROFILE_MENU: ProfileMenuItem[] = [
  {
    id: "logout",
    type: "logout",
    label: "로그아웃",
    icon: LogOut,
  },
];
