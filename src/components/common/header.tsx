// 애플리케이션 헤더 - 로고, 검색, 테마 전환, 프로필 배지 표시

import LoginButton from "@/components/auth/login-button";
import HeaderMainNav from "@/components/common/header-main-nav";
import ThemeToggleButton from "@/components/common/theme-toggle-button";
import UserAccountMenu from "@/components/common/user-account-menu";
import HeaderSearchForm from "@/components/search/header-search-form";
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
          <HeaderSearchForm />
          <ThemeToggleButton />
          {profile && <UserAccountMenu profile={profile} />}
          {!hasAuthUser && <LoginButton />}
        </div>
      </div>
    </header>
  );
}
