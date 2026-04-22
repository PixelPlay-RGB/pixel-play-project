import LoginForm from "@/components/auth/login/login-form";
import OAuthButtons from "@/components/auth/login/oauth-buttons";
import Logo from "@/components/common/logo";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function Page() {
  return (
    <div className="container m-auto">
      <div className="border-brand/20 bg-card/80 m-auto max-w-md rounded-2xl border-2 p-8 shadow-[0_0_30px_#46c6a90a] backdrop-blur-sm dark:shadow-[0_0_60px_#46c6a918]">
        <div className="mb-6 flex flex-col items-center gap-4">
          <Logo className="dark:text-foreground text-[#1e1d37]" />
          <Separator className="bg-brand/40" />
          <p className="text-xs tracking-widest uppercase">로그인</p>
        </div>
        <div className="flex flex-col gap-5">
          <LoginForm />
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs tracking-widest uppercase">또는</span>
            <Separator className="flex-1" />
          </div>
          <OAuthButtons />
          <Link
            className="text-brand self-end text-sm underline underline-offset-4 transition-colors hover:opacity-60"
            href="/auth/signup"
          >
            회원 가입
          </Link>
        </div>
      </div>
    </div>
  );
}
