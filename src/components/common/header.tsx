import LoginButton from "@/components/auth/login-button";
import Logo from "@/components/common/logo";
import ThemeToggleButton from "@/components/common/theme-toggle-button";
import HeaderProfileBadge from "@/components/profile/header-profile-badge";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-brand/15 bg-brand/5 dark:border-border dark:bg-muted/60 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-2">
        <Link href={"/"} className={"h-10 w-40"}>
          <Logo className="dark:text-foreground h-full w-full text-[#1e1d37]" />
        </Link>
        <div className={"flex items-center gap-5 pr-5"}>
          <ThemeToggleButton />
          {user ? <HeaderProfileBadge /> : <LoginButton />}
        </div>
      </div>
    </header>
  );
}
