import LoginButton from "@/components/auth/login-button";
import ThemeToggleButton from "@/components/common/theme-toggle-button";
import Link from "next/link";

export default function Header() {
  return (
    <header className={"px-10 py-5"}>
      <div className={"flex items-center justify-between"}>
        <Link href={"/"} className={"text-2xl"}>
          PixelPlay
        </Link>
        <div className={"flex items-center gap-5"}>
          <LoginButton />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
