// 사용자 계정 메뉴의 공통 항목 상수를 정의합니다.
import type { LucideIcon } from "lucide-react";
import { Heart, Key, LogOut, Radio, User, UserRoundCheck } from "lucide-react";

export type UserAccountLinkMenuItem = {
  type: "link";
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type UserAccountDialogMenuItem = {
  type: "changePassword";
  id: string;
  label: string;
  icon: LucideIcon;
};

export type UserAccountLogoutMenuItem = {
  type: "logout";
  id: string;
  label: string;
  icon: LucideIcon;
};

export type UserAccountMenuItem =
  | UserAccountLinkMenuItem
  | UserAccountDialogMenuItem
  | UserAccountLogoutMenuItem;

export const USER_ACCOUNT_PROFILE_MENU_ITEM: UserAccountLinkMenuItem = {
  type: "link",
  id: "profile",
  label: "프로필 설정",
  href: "/user/profile",
  icon: User,
};

export const USER_ACCOUNT_PRIMARY_MENU_ITEMS: UserAccountLinkMenuItem[] = [
  {
    type: "link",
    id: "channel",
    label: "채널 관리",
    href: "/channel/live",
    icon: Radio,
  },
];

export const USER_ACCOUNT_DONATION_MENU_ITEM: UserAccountLinkMenuItem = {
  type: "link",
  id: "donations",
  label: "후원",
  href: "/user/donations",
  icon: Heart,
};

export const USER_ACCOUNT_FOLLOWS_MENU_ITEM: UserAccountLinkMenuItem = {
  type: "link",
  id: "follows",
  label: "팔로우",
  href: "/user/follows",
  icon: UserRoundCheck,
};

export const USER_ACCOUNT_PASSWORD_MENU_ITEM: UserAccountDialogMenuItem = {
  type: "changePassword",
  id: "changePassword",
  label: "비밀번호 변경",
  icon: Key,
};

export const USER_ACCOUNT_LOGOUT_MENU_ITEM: UserAccountLogoutMenuItem = {
  type: "logout",
  id: "logout",
  label: "로그아웃",
  icon: LogOut,
};

export const USER_ACCOUNT_HEADER_PRIMARY_MENU_ITEMS: UserAccountMenuItem[] = [
  ...USER_ACCOUNT_PRIMARY_MENU_ITEMS,
  USER_ACCOUNT_FOLLOWS_MENU_ITEM,
  USER_ACCOUNT_DONATION_MENU_ITEM,
];

export const USER_ACCOUNT_HEADER_ACCOUNT_MENU_ITEMS: UserAccountMenuItem[] = [
  USER_ACCOUNT_PASSWORD_MENU_ITEM,
  USER_ACCOUNT_LOGOUT_MENU_ITEM,
];

export const USER_ACCOUNT_HEADER_MENU_ITEMS: UserAccountMenuItem[] = [
  ...USER_ACCOUNT_HEADER_PRIMARY_MENU_ITEMS,
  ...USER_ACCOUNT_HEADER_ACCOUNT_MENU_ITEMS,
];

export const USER_ACCOUNT_SIDEBAR_MENU_ITEMS: UserAccountMenuItem[] = [
  USER_ACCOUNT_PROFILE_MENU_ITEM,
  ...USER_ACCOUNT_PRIMARY_MENU_ITEMS,
  USER_ACCOUNT_FOLLOWS_MENU_ITEM,
  USER_ACCOUNT_DONATION_MENU_ITEM,
];
