import LoginButton from "@/components/auth/login-button";
import Logo from "@/components/common/logo";
import ThemeToggleButton from "@/components/common/theme-toggle-button";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand/15 bg-brand/5 backdrop-blur-sm dark:border-border dark:bg-muted/60">
      <div className="flex items-center justify-between px-10 py-4">
        <Link href={"/"}>
          <Logo className="text-[#1e1d37] dark:text-foreground" />
        </Link>
        <div className={"flex items-center gap-5"}>
          <LoginButton />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
