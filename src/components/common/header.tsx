import LoginButton from "@/components/auth/login-button";
import Logo from "@/components/common/logo";
import ThemeToggleButton from "@/components/common/theme-toggle-button";
import UserInfoSection from "@/components/common/user-info-section";
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-brand/15 bg-brand/5 dark:border-border dark:bg-muted/60 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="flex items-center justify-between px-10 py-4">
        <Link href={"/"}>
          <Logo className="dark:text-foreground text-[#1e1d37]" />
        </Link>
        <div className={"flex items-center gap-5"}>
          <UserInfoSection />
          <LoginButton />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
