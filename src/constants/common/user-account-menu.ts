// 사용자 계정 메뉴의 공통 항목 상수를 정의합니다.
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Heart, Key, LogOut, Radio, Tv, User, UserRoundCheck } from "lucide-react";

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

// 내 공개 채널 페이지(/channel/[myId])는 로그인 유저 id가 필요해 런타임에 생성합니다.
export const createMyChannelMenuItem = (userId: string): UserAccountLinkMenuItem => ({
  type: "link",
  id: "myChannel",
  label: "내 채널",
  href: `/channel/${userId}`,
  icon: Tv,
});

export const USER_ACCOUNT_CHANNEL_SUBSCRIPTION_MENU_ITEM: UserAccountLinkMenuItem = {
  type: "link",
  id: "channelSubscriptions",
  label: "구독",
  href: "/channel/subscribers",
  icon: BadgeCheck,
};

export const USER_ACCOUNT_DONATION_MENU_ITEM: UserAccountLinkMenuItem = {
  type: "link",
  id: "donations",
  label: "후원",
  href: "/user/donations",
  icon: Heart,
};

export const USER_ACCOUNT_FOLLOWING_MENU_ITEM: UserAccountLinkMenuItem = {
  type: "link",
  id: "following",
  label: "팔로잉",
  href: "/user/following",
  icon: UserRoundCheck,
};

export const USER_ACCOUNT_SUBSCRIPTION_MENU_ITEM: UserAccountLinkMenuItem = {
  type: "link",
  id: "subscriptions",
  label: "구독",
  href: "/user/subscriptions",
  icon: BadgeCheck,
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
  USER_ACCOUNT_FOLLOWING_MENU_ITEM,
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
  USER_ACCOUNT_FOLLOWING_MENU_ITEM,
  USER_ACCOUNT_SUBSCRIPTION_MENU_ITEM,
  USER_ACCOUNT_DONATION_MENU_ITEM,
];
