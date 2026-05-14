// 애플리케이션 헤더 - 로고, 검색, 테마 전환, 프로필 배지 표시

import LoginButton from "@/components/auth/login-button";
import Logo from "@/components/common/logo";
import ThemeToggleButton from "@/components/common/theme-toggle-button";
import HeaderSearchForm from "@/components/search/header-search-form";
import HeaderProfileBadge from "@/components/setting/profile/header-profile-badge";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasProfile = false;
  if (user) {
    const { data: profile } = await supabase.from("user").select("id").eq("id", user.id).single();

    hasProfile = !!profile;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-sm",
        "border-brand/15 bg-brand/5", // 라이트 모드 브랜드 컬러 조합
        "dark:border-border dark:bg-muted/60", // 다크 모드 톤다운 조합
      )}
    >
      <div className="flex h-14 items-center justify-between px-3 sm:px-5">
        <Link href="/" className="h-9 w-28 shrink-0 sm:w-36">
          <Logo className="text-foreground h-full w-full" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && hasProfile && <HeaderSearchForm />}
          <ThemeToggleButton />
          {user && hasProfile && <HeaderProfileBadge />}
          {!user && <LoginButton />}
        </div>
      </div>
    </header>
  );
}
