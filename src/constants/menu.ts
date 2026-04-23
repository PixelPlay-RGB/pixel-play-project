import { ProfileMenuItem } from "@/types/menu";
import { LogOut } from "lucide-react";

export const PROFILE_MENU: ProfileMenuItem[] = [
  {
    id: "logout",
    type: "logout",
    label: "로그아웃",
    icon: LogOut,
  },
];
