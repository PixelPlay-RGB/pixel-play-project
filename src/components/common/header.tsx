// 애플리케이션 헤더 - 로고, 검색/방송, 알림/테마, 계정 3개 섹션 표시

import LoginButton from "@/components/auth/login-button";
import BroadcastButton from "@/components/common/broadcast-button";
import HeaderMainNav from "@/components/common/header-main-nav";
import ThemeToggleButton from "@/components/common/theme-toggle-button";
import NotificationBell from "@/components/notification/notification-bell";
import UserAccountMenu from "@/components/common/user-account-menu";
import HeaderSearchForm from "@/components/search/header-search-form";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";

export default async function Header() {
  const { hasAuthUser, profile } = await getCurrentProfileSnapshot();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-xs",
        "route-accent-chrome text-muted-foreground",
      )}
    >
      <div className="flex h-14 items-center justify-between px-3 sm:px-5">
        <HeaderMainNav />

        <div className="flex items-center gap-2 sm:gap-3">
          {/* 섹션 1: 검색 + 방송하기 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <HeaderSearchForm />
            <BroadcastButton />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* 섹션 2: 알림 + 테마 토글 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {hasAuthUser && <NotificationBell />}
            <ThemeToggleButton />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* 섹션 3: 계정 */}
          <div className="flex items-center">
            {profile && <UserAccountMenu profile={profile} />}
            {!hasAuthUser && <LoginButton />}
          </div>
        </div>
      </div>
    </header>
  );
}
